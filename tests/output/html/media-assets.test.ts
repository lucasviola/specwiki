import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../../src/core/Logger.js";
import {
  isLocalAssetSrc,
  MediaAssetResolver,
  renderMarkdownHtml,
  resolveProjectRelativePath,
} from "../../../src/output/html/media-assets.js";

const tempDirs: string[] = [];
let stderrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log.setVerbose(false);
  stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(async () => {
  stderrSpy.mockRestore();
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { force: true, recursive: true })),
  );
});

describe("resolveProjectRelativePath", () => {
  it("resolves relative image paths from the source markdown directory", () => {
    expect(
      resolveProjectRelativePath(
        "docs/brand/specwiki-wordmark-light.svg",
        "README.md",
      ),
    ).toBe("docs/brand/specwiki-wordmark-light.svg");
    expect(
      resolveProjectRelativePath("./assets/logo.svg", "docs/README.md"),
    ).toBe("docs/assets/logo.svg");
  });

  it("ignores external and special URLs", () => {
    expect(
      resolveProjectRelativePath("https://example.com/logo.svg", "README.md"),
    ).toBeNull();
    expect(
      resolveProjectRelativePath("data:image/png;base64,abc", "README.md"),
    ).toBeNull();
    expect(resolveProjectRelativePath("../secret.png", "README.md")).toBeNull();
  });
});

describe("isLocalAssetSrc", () => {
  it("accepts project-relative paths and rejects remote URLs", () => {
    expect(isLocalAssetSrc("docs/logo.svg")).toBe(true);
    expect(isLocalAssetSrc("https://shields.io/badge.svg")).toBe(false);
    expect(isLocalAssetSrc("//cdn.example.com/logo.svg")).toBe(false);
  });
});

describe("MediaAssetResolver", () => {
  it("rewrites local img src paths and copies assets into html/media", async () => {
    const projectRoot = path.join(
      import.meta.dirname,
      "../../fixtures/sample-project",
    );
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-media-"),
    );
    tempDirs.push(outputDir);
    const htmlDir = path.join(outputDir, "html");
    await fs.mkdir(htmlDir, { recursive: true });

    const resolver = new MediaAssetResolver({
      projectRoot,
      outputDir,
      htmlDir,
    });
    const html = renderMarkdownHtml(
      "![Project logo](./docs/assets/logo.svg)",
      "README.md",
      { mediaResolver: resolver },
    );

    expect(html).toContain('src="media/docs/assets/logo.svg"');
    expect(html).not.toContain("./docs/assets/logo.svg");

    const copied = await resolver.copyAssets();
    expect(copied).toHaveLength(1);
    await expect(
      fs.readFile(path.join(htmlDir, "media/docs/assets/logo.svg"), "utf-8"),
    ).resolves.toContain("<svg");
  });

  it("rewrites markdown image syntax with bracket-heavy alt text before render", async () => {
    const projectRoot = path.join(import.meta.dirname, "../../..");
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-media-brand-"),
    );
    tempDirs.push(outputDir);
    const htmlDir = path.join(outputDir, "html");
    await fs.mkdir(htmlDir, { recursive: true });

    const resolver = new MediaAssetResolver({
      projectRoot,
      outputDir,
      htmlDir,
    });
    const html = renderMarkdownHtml(
      "![[[specwiki]] wordmark on a light background](./docs/brand/specwiki-wordmark-light.svg)",
      "README.md",
      { mediaResolver: resolver },
    );

    expect(html).toContain(
      'src="media/docs/brand/specwiki-wordmark-light.svg"',
    );
    expect(html).toContain('alt="[[specwiki]] wordmark on a light background"');
    expect(html).not.toContain("![[[specwiki]]");

    const copied = await resolver.copyAssets();
    expect(copied).toHaveLength(1);
    await expect(
      fs.readFile(
        path.join(htmlDir, "media/docs/brand/specwiki-wordmark-light.svg"),
        "utf-8",
      ),
    ).resolves.toContain("<svg");
  });

  it("leaves external badge URLs unchanged", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-empty-"),
    );
    tempDirs.push(projectRoot);
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-media-out-"),
    );
    tempDirs.push(outputDir);
    const htmlDir = path.join(outputDir, "html");
    await fs.mkdir(htmlDir, { recursive: true });

    const resolver = new MediaAssetResolver({
      projectRoot,
      outputDir,
      htmlDir,
    });
    const html = resolver.rewriteHtml(
      '<img src="https://example.com/badge.svg" alt="badge">',
      "README.md",
    );

    expect(html).toContain('src="https://example.com/badge.svg"');
    expect(await resolver.copyAssets()).toEqual([]);
  });

  it("logs output.error when a referenced asset is missing", async () => {
    const projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-empty-"),
    );
    tempDirs.push(projectRoot);
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "specwiki-media-miss-"),
    );
    tempDirs.push(outputDir);
    const htmlDir = path.join(outputDir, "html");
    await fs.mkdir(htmlDir, { recursive: true });

    const resolver = new MediaAssetResolver({
      projectRoot,
      outputDir,
      htmlDir,
    });
    resolver.rewriteHtml(
      '<img src="missing/logo.svg" alt="logo">',
      "README.md",
    );
    await resolver.copyAssets();

    const events = stderrSpy.mock.calls
      .map(([chunk]) => String(chunk).trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(events.some((event) => event.event === "output.error")).toBe(true);
  });
});
