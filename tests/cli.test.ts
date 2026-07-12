import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const cliPath = path.join(projectRoot, "src/cli.ts");
const fixtureRoot = path.join(projectRoot, "tests/fixtures/sample-project");

describe("cli list --verbose", () => {
  it("emits structured discover logs on stderr", async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx/esm",
        cliPath,
        "list",
        "--verbose",
        "--project",
        fixtureRoot,
      ],
      { cwd: projectRoot },
    );

    expect(stdout).toContain("Found");
    expect(stdout).toContain("Agent Instructions — AGENTS.md");

    const lines = stderr
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    const events = lines.map((line) => line.event);

    expect(events[0]).toBe("discover.start");
    expect(events.at(-1)).toBe("discover.complete");
    expect(lines.filter((line) => line.event === "discover.match").length).toBe(
      lines.find((line) => line.event === "discover.complete")?.matchCount,
    );
  });
});
