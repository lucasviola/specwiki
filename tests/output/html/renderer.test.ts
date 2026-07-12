import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HtmlRenderer,
  getHtmlRenderer,
  resetHtmlRendererCache,
} from "../../../src/output/html/renderer.js";

describe("HtmlRenderer", () => {
  let renderer: HtmlRenderer;

  beforeEach(async () => {
    resetHtmlRendererCache();
    renderer = await HtmlRenderer.create();
  });

  afterEach(() => {
    resetHtmlRendererCache();
  });

  it("renders index page with escaped title and external stylesheet", () => {
    const html = renderer.renderIndex(
      "Evil <img src=x onerror=alert(1)>",
      "<h1>Index</h1>",
    );

    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain(
      '<link rel="stylesheet" href="assets/specwiki.css">',
    );
    expect(html).toContain(
      "<title>Evil &lt;img src=x onerror=alert(1)&gt; — Spec Wiki</title>",
    );
    expect(html).toContain('<header class="specwiki-header">');
    expect(html).toContain('<article class="specwiki-article specwiki-index">');
    expect(html).toContain("<h1>Index</h1>");
    expect(html).not.toContain("<style>");
    expect(html).not.toMatch(/<title>[^<]*<img/);
  });

  it("renders article page with back navigation", () => {
    const html = renderer.renderArticle("Architecture", "<p>Body</p>");

    expect(html).toContain("<title>Architecture — Spec Wiki</title>");
    expect(html).toContain(
      '<nav class="specwiki-nav"><a href="index.html">← Back to index</a></nav>',
    );
    expect(html).toContain('<article class="specwiki-article">');
    expect(html).toContain("<p>Body</p>");
    expect(html).not.toContain("specwiki-index");
  });

  it("escapes ampersands in title without double-escaping body HTML", () => {
    const html = renderer.renderArticle(
      "Tom & Jerry",
      "<p>Content &amp; more</p>",
    );

    expect(html).toContain("<title>Tom &amp; Jerry — Spec Wiki</title>");
    expect(html).toContain("<p>Content &amp; more</p>");
  });

  it("escapes script injection payloads in titles", () => {
    const malicious = '<script>alert("x")</script>';
    const html = renderer.renderArticle(malicious, "<p>Safe</p>");
    const escaped = "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;";

    expect(html).toContain(`<title>${escaped} — Spec Wiki</title>`);
    expect(html).not.toContain("<script>");
  });

  it("bundles wikimedia-ui-base tokens with specwiki layout CSS", async () => {
    const css = await HtmlRenderer.bundleCss();

    expect(css).toContain("--background-color-base");
    expect(css).toContain("--color-primary");
    expect(css).toContain("--font-family-base");
    expect(css).toContain(".specwiki-header");
    expect(css).toContain(".specwiki-logo");
  });

  it("reuses cached renderer from getHtmlRenderer", async () => {
    const first = await getHtmlRenderer();
    const second = await getHtmlRenderer();

    expect(first).toBe(second);
  });

  it("emits output.error path on template load failure", async () => {
    const readSpy = vi
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce(new Error("missing template"));

    await expect(HtmlRenderer.create()).rejects.toThrow("missing template");
    readSpy.mockRestore();
  });

  it("emits output.error path on CSS bundle failure", async () => {
    const readSpy = vi
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce(new Error("missing css"));

    await expect(HtmlRenderer.bundleCss()).rejects.toThrow("missing css");
    readSpy.mockRestore();
  });
});

describe("HtmlRenderer asset paths", () => {
  it("resolves templates relative to the renderer module", async () => {
    const renderer = await HtmlRenderer.create();
    const html = renderer.renderIndex("Spec Wiki", "<p>Hello</p>");

    expect(html).toContain('href="assets/specwiki.css"');
    expect(html).not.toMatch(/href="\/assets\//);
  });
});
