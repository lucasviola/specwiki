import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assertNoRootAbsoluteUrlsInHtml,
  assertNoRootAbsoluteUrlsInHtmlTree,
} from "../../scripts/lib/assert-no-root-absolute-urls.mjs";
import {
  buildExamples,
  parseBuildExamplesArgs,
} from "../../scripts/build-examples.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const scriptPath = path.join(projectRoot, "scripts/build-examples.mjs");
const cliPath = path.join(projectRoot, "dist/cli.js");

let tempOutputDir: string;

beforeAll(() => {
  execFileSync("npm", ["run", "build"], {
    cwd: projectRoot,
    stdio: "pipe",
  });
  tempOutputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "specwiki-build-examples-"),
  );
});

afterAll(() => {
  fs.rmSync(tempOutputDir, { recursive: true, force: true });
});

describe("parseBuildExamplesArgs", () => {
  it("defaults to hero-only output under dist/landing-site", () => {
    const args = parseBuildExamplesArgs([]);

    expect(args.heroOnly).toBe(true);
    expect(args.all).toBe(false);
    expect(args.siteOutputDir).toBe(
      path.join(projectRoot, "dist/landing-site"),
    );
  });

  it("honours --all and --output=", () => {
    const args = parseBuildExamplesArgs(["--all", `--output=${tempOutputDir}`]);

    expect(args.all).toBe(true);
    expect(args.heroOnly).toBe(false);
    expect(args.siteOutputDir).toBe(tempOutputDir);
  });
});

describe("assert-no-root-absolute-urls", () => {
  it("rejects root-absolute href and src attributes", () => {
    expect(() =>
      assertNoRootAbsoluteUrlsInHtml('<a href="/blog">Blog</a>', "sample.html"),
    ).toThrow(/root-absolute/);
    expect(() =>
      assertNoRootAbsoluteUrlsInHtml(
        '<img src="/assets/x.png">',
        "sample.html",
      ),
    ).toThrow(/root-absolute/);
  });

  it("allows relative and protocol-relative URLs", () => {
    expect(() =>
      assertNoRootAbsoluteUrlsInHtml(
        '<a href="index.html">Home</a><img src="//cdn.example/x.png">',
        "sample.html",
      ),
    ).not.toThrow();
  });
});

describe("build:examples (S27.2)", () => {
  it("defines scripts/build-examples.mjs", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it("exposes build:examples in package.json", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    );

    expect(pkg.scripts["build:examples"]).toBe(
      "node scripts/build-examples.mjs",
    );
  });

  it("generates hero wiki under output/examples/<slug>/html/index.html", async () => {
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "specwiki-hero-example-"),
    );

    try {
      const result = await buildExamples({
        heroOnly: true,
        siteOutputDir: outputDir,
      });

      expect(result.slugs).toEqual(["agent-harness-parcel"]);
      const indexPath = path.join(
        outputDir,
        "examples/agent-harness-parcel/html/index.html",
      );
      expect(fs.existsSync(indexPath)).toBe(true);
      await assertNoRootAbsoluteUrlsInHtmlTree(
        path.join(outputDir, "examples/agent-harness-parcel"),
      );
    } finally {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });

  it("does not leave wiki staging output in examples/agent-harness-parcel/", async () => {
    const outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "specwiki-hero-clean-"),
    );
    const stagingDir = path.join(
      projectRoot,
      "examples/agent-harness-parcel/wiki",
    );

    try {
      await buildExamples({ heroOnly: true, siteOutputDir: outputDir });
      expect(fs.existsSync(stagingDir)).toBe(false);
    } finally {
      fs.rmSync(outputDir, { recursive: true, force: true });
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
  });

  it("fails with actionable message when dist/cli.js is missing", async () => {
    const missingCliBackup = `${cliPath}.bak`;
    const hadCli = fs.existsSync(cliPath);

    if (hadCli) {
      fs.renameSync(cliPath, missingCliBackup);
    }

    try {
      await expect(
        buildExamples({
          heroOnly: true,
          siteOutputDir: tempOutputDir,
        }),
      ).rejects.toThrow(/dist\/cli\.js not found/);
    } finally {
      if (hadCli) {
        fs.renameSync(missingCliBackup, cliPath);
      }
    }
  });
});
