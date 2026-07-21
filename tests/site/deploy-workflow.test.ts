import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const workflowPath = path.join(
  projectRoot,
  ".github/workflows/deploy-site.yml",
);
const hostingDocPath = path.join(projectRoot, "docs/hosting/specwiki-ai.md");

function readWorkflow(): string {
  return fs.readFileSync(workflowPath, "utf8");
}

function extractOnBlock(workflow: string): string {
  const lines = workflow.split("\n");
  const onIndex = lines.findIndex((line) => line.trim() === "on:");
  if (onIndex === -1) {
    return "";
  }

  const onLines: string[] = [];
  for (let i = onIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() !== "" && !/^\s/.test(line)) {
      break;
    }
    onLines.push(line);
  }

  return onLines.join("\n");
}

describe("S20.3 deploy-site workflow", () => {
  it("defines a workflow at .github/workflows/deploy-site.yml", () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it("runs on push to main, pull_request, and workflow_dispatch", () => {
    const onBlock = extractOnBlock(readWorkflow());

    expect(onBlock).toMatch(/^\s*push:\s*$/m);
    expect(onBlock).toMatch(/branches:\s*\[main\]/);
    expect(onBlock).toMatch(/^\s*pull_request:\s*$/m);
    expect(onBlock).toMatch(/^\s*workflow_dispatch:\s*$/m);
  });

  it("requests GitHub Pages permissions without committed secrets", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(/pages:\s*write/);
    expect(workflow).toMatch(/id-token:\s*write/);
    expect(workflow).not.toMatch(/secrets\./);
  });

  it("verifies the landing page and blog before building and deploying", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(/npm test -- tests\/site\//);
    expect(workflow).toMatch(/npm run build:site/);
    expect(workflow).toMatch(/actions\/upload-pages-artifact@v3/);
    expect(workflow).toMatch(/actions\/deploy-pages@v4/);
  });

  it("builds the CLI and generates all example wikis before build:site", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(/npm run build$/m);
    expect(workflow).toMatch(/npm run build:examples -- --all/);
  });

  it("guards production deploy to push and workflow_dispatch only", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(
      /deploy-production:[\s\S]*?if:\s*github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/,
    );
  });

  it("deploys PR previews separately from production", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(
      /deploy-preview:[\s\S]*?if:\s*github\.event_name == 'pull_request'/,
    );
  });

  it("builds with CNAME for the specwiki.ai custom domain", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(/npm run build:site -- --with-cname/);
  });

  it("uploads the reproducible landing-site artifact path", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(/path:\s*dist\/landing-site/);
  });
});

describe("S20.3 hosting documentation", () => {
  it("documents specwiki.ai deployment in docs/hosting/specwiki-ai.md", () => {
    expect(fs.existsSync(hostingDocPath)).toBe(true);
  });

  it("covers build command, DNS, rollback, and verification", () => {
    const doc = fs.readFileSync(hostingDocPath, "utf8");

    expect(doc).toMatch(/npm run build:site/);
    expect(doc).toMatch(/specwiki\.ai/);
    expect(doc).toMatch(/rollback/i);
    expect(doc).toMatch(/DNS/i);
    expect(doc).toMatch(/HTTPS/i);
    expect(doc).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
    expect(doc).not.toMatch(/secrets?\s*[:=]/i);
  });

  it("includes /blog/ in the production verification checklist", () => {
    const doc = fs.readFileSync(hostingDocPath, "utf8");

    expect(doc).toMatch(/specwiki\.ai\/blog/);
    expect(doc).toMatch(/npm test -- tests\/site\//);
  });

  it("documents the default GitHub Pages URL before custom domain setup", () => {
    const doc = fs.readFileSync(hostingDocPath, "utf8");

    expect(doc).toMatch(/lucasviola\.github\.io\/specwiki/);
    expect(doc).toMatch(/--with-cname/);
  });
});

describe("S20.3 package script", () => {
  it("exposes build:site in package.json", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    );

    expect(pkg.scripts["build:site"]).toBe(
      "node scripts/build-landing-site.mjs",
    );
  });

  it("exposes build:examples in package.json", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    );

    expect(pkg.scripts["build:examples"]).toBe(
      "node scripts/build-examples.mjs",
    );
  });
});
