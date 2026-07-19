import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const releasingDocPath = path.join(projectRoot, "docs/RELEASING.md");
const readmePath = path.join(projectRoot, "README.md");

const REQUIRED_PUBLISH_SCRIPTS = [
  "verify-package",
  "prepublishOnly",
  "publish:package",
  "audit",
] as const;

type PackageJson = {
  scripts: Record<string, string>;
};

function readPackageJson(): PackageJson {
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  ) as PackageJson;
}

function readReleasingDoc(): string {
  return fs.readFileSync(releasingDocPath, "utf8");
}

describe("maintainer publish scripts contract", () => {
  it("declares the scripts referenced by the releasing checklist", () => {
    const { scripts } = readPackageJson();

    for (const script of REQUIRED_PUBLISH_SCRIPTS) {
      expect(
        scripts[script],
        `missing package.json script: ${script}`,
      ).toBeDefined();
    }

    expect(scripts["verify-package"]).toBe("node scripts/verify-package.mjs");
    expect(scripts.prepublishOnly).toBe("node scripts/prepublish-check.mjs");
    expect(scripts["publish:package"]).toBe("node scripts/publish-package.mjs");
    expect(scripts.audit).toBe("npm audit --audit-level=high --omit=dev");
  });

  it("runs verify-package before npm publish in publish-package.mjs", () => {
    const script = fs.readFileSync(
      path.join(projectRoot, "scripts/publish-package.mjs"),
      "utf8",
    );

    const verifyIndex = script.indexOf("runVerifyPackage");
    const publishIndex = script.indexOf(
      'npmArgs = dryRun ? ["publish", "--dry-run"]',
    );

    expect(verifyIndex).toBeGreaterThanOrEqual(0);
    expect(publishIndex).toBeGreaterThan(verifyIndex);
  });
});

describe("docs/RELEASING.md maintainer checklist", () => {
  it("exists at docs/RELEASING.md", () => {
    expect(fs.existsSync(releasingDocPath)).toBe(true);
  });

  it("documents numbered pre-publish verification steps", () => {
    const doc = readReleasingDoc();

    expect(doc).toMatch(/npm run verify-package/);
    expect(doc).toMatch(/npm run prepublishOnly/);
    expect(doc).toMatch(/npm run publish:package -- --dry-run/);
    expect(doc).toMatch(/npm run publish:package -- --confirm/);
    expect(doc).toMatch(/npm run audit|npm audit/i);
    expect(doc).toMatch(/--omit=dev/);
    expect(doc).toMatch(/21-5-release-dependency-audit-gate|S21\.5/i);

    const dryRunStep = doc.match(
      /11\. Run \*\*`npm run publish:package -- --dry-run`\*\*/,
    );
    const confirmStep = doc.match(
      /12\. When all checks pass, run \*\*`npm run publish:package -- --confirm`\*\*/,
    );

    expect(dryRunStep).not.toBeNull();
    expect(confirmStep).not.toBeNull();
    expect(dryRunStep!.index).toBeLessThan(confirmStep!.index!);
  });

  it("requires npm account 2FA and secret hygiene before publish", () => {
    const doc = readReleasingDoc();

    expect(doc).toMatch(/2FA|two-factor/i);
    expect(doc).toMatch(/check-secrets/);
    expect(doc).toMatch(/\.githooks\/pre-commit|pre-commit hook/i);
    expect(doc).toMatch(/secret/i);
  });

  it("references tarball and install-hook guards", () => {
    const doc = readReleasingDoc();

    expect(doc).toMatch(/postinstall|prepare/i);
    expect(doc).toMatch(/files/i);
    expect(doc).toMatch(/allowlist|tarball/i);
    expect(doc).toMatch(/npm pack/i);
  });

  it("warns against publishing from a dirty tree with unintended files", () => {
    const doc = readReleasingDoc();

    expect(doc).toMatch(/dirty|clean (git )?tree|uncommitted/i);
    expect(doc).toMatch(/unintended|review.*pack|pack listing/i);
  });

  it("does not embed registry tokens or credentials", () => {
    const doc = readReleasingDoc();

    expect(doc).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
    expect(doc).not.toMatch(/npm_[A-Za-z0-9]{20,}/);
    expect(doc).not.toMatch(/NPM_TOKEN\s*=\s*["'][^"']+["']/);
  });
});

describe("README maintainer section", () => {
  it("links maintainers to docs/RELEASING.md", () => {
    const readme = fs.readFileSync(readmePath, "utf8");

    expect(fs.existsSync(releasingDocPath)).toBe(true);
    expect(readme).toMatch(/docs\/RELEASING\.md/);
    expect(readme).toMatch(/For maintainers|maintainer/i);
  });
});
