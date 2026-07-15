import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";
import { buildLlmsTxt, writeLlmsTxt } from "../../src/output/llms.js";
import type { WikiPage } from "../../src/types.js";

const tempDirs: string[] = [];
let stderrSpy: ReturnType<typeof vi.spyOn>;

function page(
  overrides: Partial<WikiPage> & Pick<WikiPage, "slug" | "title" | "category">,
): WikiPage {
  return {
    content: "",
    description: "",
    sections: [],
    sourcePath: `${overrides.slug}.md`,
    ...overrides,
  };
}

beforeEach(() => {
  log.setVerbose(false);
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(async () => {
  log.setVerbose(false);
  stderrSpy.mockRestore();
  await Promise.all(
    tempDirs
      .splice(0)
      .map((directory) => fs.rm(directory, { force: true, recursive: true })),
  );
});

describe("buildLlmsTxt", () => {
  it("builds a category-grouped manifest with labels and descriptions", () => {
    expect(
      buildLlmsTxt([
        page({
          slug: "specs-api",
          title: "API",
          category: "specs",
          description: "API contract.",
        }),
        page({
          slug: "agents",
          title: "Agent Instructions",
          category: "root",
          description: "Repository guidance.",
        }),
        page({
          slug: "specs-cli",
          title: "CLI",
          category: "specs",
          description: "CLI contract.",
        }),
      ]),
    ).toMatchInlineSnapshot(`
      "# Spec Wiki

      > Generated index of documentation discovered by specwiki.

      ## Project Root

      - [Agent Instructions](agents.md): Repository guidance.

      ## Specifications

      - [API](specs-api.md): API contract.
      - [CLI](specs-cli.md): CLI contract.
      "
    `);
  });

  it("omits the description separator for pages without descriptions", () => {
    expect(
      buildLlmsTxt([
        page({
          slug: "notes",
          title: "Notes",
          category: "custom",
          description: "",
        }),
      ]),
    ).toContain("## custom\n\n- [Notes](notes.md)\n");
  });
});

describe("writeLlmsTxt", () => {
  it("writes only under the output directory and emits a safe verbose event", async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-llms-"),
    );
    tempDirs.push(outputDir);
    log.setVerbose(true);

    const manifestPath = await writeLlmsTxt(outputDir, [
      page({
        slug: "spec",
        title: "Spec",
        category: "specs",
        description: "A specification.",
      }),
    ]);

    expect(manifestPath).toBe(path.join(outputDir, "llms.txt"));
    await expect(fs.readFile(manifestPath, "utf-8")).resolves.toContain(
      "[Spec](spec.md)",
    );
    expect(
      stderrSpy.mock.calls.map(([line]) => JSON.parse(String(line))),
    ).toContainEqual({
      event: "output.write",
      level: "info",
      relativePath: "llms.txt",
    });
  });

  it("logs and rethrows write failures without exposing page content", async () => {
    const outputFile = path.join(os.tmpdir(), `specwiki-llms-${Date.now()}`);
    tempDirs.push(outputFile);
    await fs.writeFile(outputFile, "");

    await expect(
      writeLlmsTxt(outputFile, [
        page({
          slug: "secret",
          title: "Secret",
          category: "specs",
          description: "Sensitive source content must not be logged.",
        }),
      ]),
    ).rejects.toMatchObject({ code: "ENOTDIR" });

    const records = stderrSpy.mock.calls.map(([line]) =>
      JSON.parse(String(line)),
    );
    expect(records).toContainEqual(
      expect.objectContaining({
        event: "output.error",
        relativePath: "llms.txt",
      }),
    );
    expect(JSON.stringify(records)).not.toContain("Sensitive source content");
  });
});
