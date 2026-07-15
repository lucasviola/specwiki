import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const workflowPath = path.join(projectRoot, ".github/workflows/ci.yml");

const QUALITY_GATE_SCRIPTS = [
  "npm run test",
  "npm run lint",
  "npm run format",
  "npm run coverage",
  "npm run typecheck",
  "npm run build",
] as const;

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

function extractRunCommands(workflow: string): string[] {
  return [...workflow.matchAll(/^\s+run:\s*(.+)$/gm)].map((match) =>
    match[1].trim(),
  );
}

describe("GitHub Actions CI workflow", () => {
  it("defines a workflow at .github/workflows/ci.yml", () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it("runs on push and pull_request", () => {
    const onBlock = extractOnBlock(readWorkflow());

    expect(onBlock).toMatch(/^\s*push:\s*$/m);
    expect(onBlock).toMatch(/^\s*pull_request:\s*$/m);
  });

  it("uses Node 20.x on ubuntu-latest", () => {
    const workflow = readWorkflow();

    expect(workflow).toMatch(/runs-on:\s*ubuntu-latest/);
    expect(workflow).toMatch(/node-version:\s*["']20(\.x)?["']/);
  });

  it("installs dependencies with npm ci before the quality gate", () => {
    const commands = extractRunCommands(readWorkflow());
    const installIndex = commands.indexOf("npm ci");
    const firstGateIndex = commands.indexOf(QUALITY_GATE_SCRIPTS[0]);

    expect(installIndex).toBeGreaterThanOrEqual(0);
    expect(firstGateIndex).toBeGreaterThan(installIndex);
  });

  it("runs the canonical HARNESS §0.2 quality gate in order", () => {
    const commands = extractRunCommands(readWorkflow());
    const gateCommands = commands.filter((command) =>
      QUALITY_GATE_SCRIPTS.includes(
        command as (typeof QUALITY_GATE_SCRIPTS)[number],
      ),
    );

    expect(gateCommands).toEqual([...QUALITY_GATE_SCRIPTS]);
  });

  it("does not publish to npm or request registry credentials", () => {
    const workflow = readWorkflow();

    expect(workflow).not.toMatch(/npm\s+publish/);
    expect(workflow).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/);
    expect(workflow).not.toMatch(/npm\s+login/);
    expect(workflow).not.toMatch(/registry-url\s*:/);
    expect(workflow).not.toMatch(/secrets\./);
  });
});
