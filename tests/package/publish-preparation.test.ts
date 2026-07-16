import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  QUALITY_GATE_STEPS,
  formatPrepMessage,
  parsePrepublishArgs,
} from "../../scripts/prepublish-check.mjs";
import {
  FORBIDDEN_TAR_PREFIXES,
  REQUIRED_TAR_ENTRIES,
  npmSubprocessEnv,
  tarballFileName,
  validateTarballEntries,
} from "../../scripts/verify-package.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const prepublishScript = path.join(projectRoot, "scripts/prepublish-check.mjs");
const verifyScript = path.join(projectRoot, "scripts/verify-package.mjs");

type PackageJson = {
  scripts: Record<string, string>;
};

function readPackageJson(): PackageJson {
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  ) as PackageJson;
}

function readScript(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("prepublish check", () => {
  it("declares prepublishOnly pointing at prepublish-check.mjs", () => {
    expect(readPackageJson().scripts.prepublishOnly).toBe(
      "node scripts/prepublish-check.mjs",
    );
  });

  it("runs the canonical HARNESS §0.2 quality gate in order", () => {
    expect(QUALITY_GATE_STEPS).toEqual([
      "test",
      "lint",
      "format",
      "coverage",
      "typecheck",
      "build",
    ]);

    const script = readScript("scripts/prepublish-check.mjs");
    const gateIndex = script.indexOf("QUALITY_GATE_STEPS");
    expect(gateIndex).toBeGreaterThanOrEqual(0);

    for (const step of QUALITY_GATE_STEPS) {
      expect(script).toContain(`"${step}"`);
    }
  });

  it("formats deterministic publish.prep diagnostics", () => {
    expect(formatPrepMessage("test", "start")).toBe("publish.prep test start");
    expect(formatPrepMessage("build", "ok")).toBe("publish.prep build ok");
  });

  it("supports verbose dry-run without executing gate scripts", () => {
    const result = spawnSync(
      "node",
      [prepublishScript, "--verbose", "--dry-run"],
      {
        cwd: projectRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(0);

    const lines = result.stdout
      .trim()
      .split("\n")
      .filter((line) => line.startsWith("publish.prep "));

    expect(lines).toEqual(
      QUALITY_GATE_STEPS.flatMap((step) => [
        `publish.prep ${step} skip`,
        `publish.prep ${step} ok`,
      ]),
    );
  });

  it("keeps verbose diagnostics free of secrets and absolute paths", () => {
    const result = spawnSync(
      "node",
      [prepublishScript, "--verbose", "--dry-run"],
      {
        cwd: projectRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          NPM_TOKEN: "npm_test_secret_token_value",
          HOME: "/Users/sensitive/home",
        },
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("npm_test_secret_token_value");
    expect(result.stdout).not.toContain("/Users/sensitive/home");

    const diagnosticLines = result.stdout.trim().split("\n").filter(Boolean);

    expect(diagnosticLines.length).toBeGreaterThan(0);
    for (const line of diagnosticLines) {
      expect(line).toMatch(/^publish\.prep [a-z]+ (start|ok|fail|skip)$/);
    }
  });

  it("does not treat arbitrary flags as verbose mode", () => {
    expect(parsePrepublishArgs(["--dry-run"])).toEqual({
      verbose: false,
      dryRun: true,
    });
  });
});

describe("verify package", () => {
  it("declares verify-package pointing at verify-package.mjs", () => {
    expect(readPackageJson().scripts["verify-package"]).toBe(
      "node scripts/verify-package.mjs",
    );
  });

  it("rejects tarballs missing required consumer artifacts", () => {
    expect(() => validateTarballEntries(["package/package.json"])).toThrow(
      /missing required entries/,
    );
  });

  it("rejects tarballs containing internal repository paths", () => {
    const entries = [
      ...REQUIRED_TAR_ENTRIES,
      "package/src/cli.ts",
      "package/tests/output/wiki.test.ts",
    ];

    expect(() => validateTarballEntries(entries)).toThrow(/forbidden entries/);
    expect(FORBIDDEN_TAR_PREFIXES).toContain("package/src/");
    expect(FORBIDDEN_TAR_PREFIXES).toContain("package/tests/");
  });

  it("builds tarball filenames for scoped package names", () => {
    expect(tarballFileName("@lucasviola/specwiki", "1.0.0")).toBe(
      "lucasviola-specwiki-1.0.0.tgz",
    );
    expect(tarballFileName("specwiki", "0.1.0")).toBe("specwiki-0.1.0.tgz");
  });

  it("strips npm publish dry-run config from nested npm subprocess env", () => {
    const env = npmSubprocessEnv({
      npm_config_dry_run: "true",
      npm_config_dryRun: "true",
      npm_config_loglevel: "error",
    });

    expect(env.npm_config_dry_run).toBeUndefined();
    expect(env.npm_config_dryRun).toBeUndefined();
    expect(env.npm_config_loglevel).toBe("error");
  });

  it("packs, installs, and runs specwiki --help from a clean temporary prefix", () => {
    const result = spawnSync("node", [verifyScript], {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        npm_config_loglevel: "error",
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      "verify-package: tarball validated and CLI --help succeeded",
    );
    expect(result.stderr).not.toMatch(/npm ERR!/);
  }, 180_000);

  it("packs and installs when npm publish --dry-run config is inherited", () => {
    const result = spawnSync("node", [verifyScript], {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        npm_config_dry_run: "true",
        npm_config_loglevel: "error",
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      "verify-package: tarball validated and CLI --help succeeded",
    );
    expect(result.stderr).not.toMatch(/npm ERR!/);
  }, 180_000);
});
