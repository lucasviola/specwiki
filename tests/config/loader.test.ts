import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ConfigError,
  loadProjectConfig,
  resolveEffectivePatterns,
  resolvePatternsFromEnv,
} from "../../src/config/loader.js";

const originalEnv = process.env.SPECWIKI_PATTERNS;

afterEach(async () => {
  if (originalEnv === undefined) {
    delete process.env.SPECWIKI_PATTERNS;
  } else {
    process.env.SPECWIKI_PATTERNS = originalEnv;
  }
});

describe("loadProjectConfig", () => {
  it("loads patterns from specwiki.config.json", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-config-json-"),
    );
    try {
      await fs.writeFile(
        path.join(root, "specwiki.config.json"),
        JSON.stringify({ patterns: ["custom/**/*.md"] }),
      );

      const loaded = await loadProjectConfig(root);
      expect(loaded).toEqual({
        config: { patterns: ["custom/**/*.md"] },
        sourcePath: "specwiki.config.json",
      });
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("prefers specwiki.config.js over specwiki.config.json", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-config-js-pref-"),
    );
    try {
      await fs.writeFile(
        path.join(root, "specwiki.config.json"),
        JSON.stringify({ patterns: ["json/**/*.md"] }),
      );
      await fs.writeFile(
        path.join(root, "specwiki.config.js"),
        'export default { patterns: ["js/**/*.md"] };',
      );

      const loaded = await loadProjectConfig(root);
      expect(loaded?.sourcePath).toBe("specwiki.config.js");
      expect(loaded?.config.patterns).toEqual(["js/**/*.md"]);
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("returns null when no config file exists", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-config-none-"),
    );
    try {
      await expect(loadProjectConfig(root)).resolves.toBeNull();
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("accepts config without a patterns key", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-config-empty-"),
    );
    try {
      await fs.writeFile(path.join(root, "specwiki.config.json"), "{}");

      const loaded = await loadProjectConfig(root);
      expect(loaded?.config).toEqual({});
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it.each([
    ["{", "Invalid JSON in specwiki.config.json"],
    [
      '{"patterns":"not-an-array"}',
      "Config patterns must be an array of glob strings",
    ],
    [
      '{"patterns":[""]}',
      "Patterns must be a comma-separated list of non-empty globs",
    ],
    [
      '{"patterns":["../**/*.md"]}',
      "Patterns must stay within the project root",
    ],
  ])("rejects invalid config content: %s", async (content, message) => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-config-invalid-"),
    );
    try {
      await fs.writeFile(path.join(root, "specwiki.config.json"), content);

      await expect(loadProjectConfig(root)).rejects.toMatchObject({
        name: "ConfigError",
        message,
      });
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("rejects config files that resolve outside the project root", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-config-symlink-"),
    );
    const outsideDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-config-outside-"),
    );

    try {
      await fs.writeFile(
        path.join(outsideDir, "specwiki.config.json"),
        JSON.stringify({ patterns: ["outside/**/*.md"] }),
      );
      await fs.symlink(
        path.join(outsideDir, "specwiki.config.json"),
        path.join(root, "specwiki.config.json"),
      );

      await expect(loadProjectConfig(root)).rejects.toMatchObject({
        name: "ConfigError",
        message: "Config file must stay within the project root",
      });
    } finally {
      await fs.rm(root, { force: true, recursive: true });
      await fs.rm(outsideDir, { force: true, recursive: true });
    }
  });

  it("reports invalid JavaScript without leaking loader internals", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-config-bad-js-"),
    );
    try {
      await fs.writeFile(
        path.join(root, "specwiki.config.js"),
        "export default {",
      );

      await expect(loadProjectConfig(root)).rejects.toSatisfy(
        (err: unknown) => {
          expect(err).toMatchObject({ name: "ConfigError" });
          const message = err instanceof Error ? err.message : "";
          expect(message).toMatch(
            /^(Invalid JavaScript in specwiki\.config\.js|Failed to load specwiki\.config\.js)$/,
          );
          expect(message).not.toContain("export default");
          return true;
        },
      );
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });
});

describe("resolvePatternsFromEnv", () => {
  it("parses SPECWIKI_PATTERNS as a comma-separated list", () => {
    process.env.SPECWIKI_PATTERNS = " custom/**/*.md, docs/**/*.md ";
    expect(resolvePatternsFromEnv()).toEqual([
      "custom/**/*.md",
      "docs/**/*.md",
    ]);
  });

  it("returns undefined when env var is unset or empty", () => {
    delete process.env.SPECWIKI_PATTERNS;
    expect(resolvePatternsFromEnv()).toBeUndefined();

    process.env.SPECWIKI_PATTERNS = "";
    expect(resolvePatternsFromEnv()).toBeUndefined();
  });
});

describe("resolveEffectivePatterns", () => {
  it("prefers CLI patterns over env and config", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-resolve-cli-"),
    );
    try {
      process.env.SPECWIKI_PATTERNS = "env/**/*.md";
      await fs.writeFile(
        path.join(root, "specwiki.config.json"),
        JSON.stringify({ patterns: ["config/**/*.md"] }),
      );

      const resolved = await resolveEffectivePatterns({
        projectRoot: root,
        cliPatterns: ["cli/**/*.md"],
      });

      expect(resolved).toEqual({ patterns: ["cli/**/*.md"] });
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("prefers env patterns over project config", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-resolve-env-"),
    );
    try {
      process.env.SPECWIKI_PATTERNS = "env/**/*.md";
      await fs.writeFile(
        path.join(root, "specwiki.config.json"),
        JSON.stringify({ patterns: ["config/**/*.md"] }),
      );

      const resolved = await resolveEffectivePatterns({ projectRoot: root });
      expect(resolved).toEqual({ patterns: ["env/**/*.md"] });
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("uses project config patterns when no CLI or env override", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-resolve-config-"),
    );
    try {
      delete process.env.SPECWIKI_PATTERNS;
      await fs.writeFile(
        path.join(root, "specwiki.config.json"),
        JSON.stringify({ patterns: ["config/**/*.md"] }),
      );

      const resolved = await resolveEffectivePatterns({ projectRoot: root });
      expect(resolved).toEqual({
        patterns: ["config/**/*.md"],
        configSource: "specwiki.config.json",
      });
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("returns empty resolution when no overrides exist", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-resolve-default-"),
    );
    try {
      delete process.env.SPECWIKI_PATTERNS;
      await expect(
        resolveEffectivePatterns({ projectRoot: root }),
      ).resolves.toEqual({});
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("propagates ConfigError from invalid env patterns", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-resolve-bad-env-"),
    );
    try {
      process.env.SPECWIKI_PATTERNS = "bad,";
      await expect(
        resolveEffectivePatterns({ projectRoot: root }),
      ).rejects.toBeInstanceOf(ConfigError);
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });
});
