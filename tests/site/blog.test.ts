import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const scriptPath = path.join(projectRoot, "scripts/build-landing-site.mjs");
const blogCssPath = path.join(projectRoot, "site/assets/blog.css");

let outputDir: string;
let indexHtml: string;
let postHtml: string;

beforeAll(() => {
  outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "specwiki-blog-site-"));
  execFileSync("node", [scriptPath, `--output=${outputDir}`], {
    cwd: projectRoot,
    stdio: "pipe",
  });

  indexHtml = fs.readFileSync(path.join(outputDir, "blog/index.html"), "utf8");
  postHtml = fs.readFileSync(
    path.join(outputDir, "blog/2026-07-20-seed-post.html"),
    "utf8",
  );
});

afterAll(() => {
  fs.rmSync(outputDir, { recursive: true, force: true });
});

describe("S28.2 blog index", () => {
  it("lists the seed post under Field Notes", () => {
    expect(indexHtml).toContain('id="lane-field-notes"');
    expect(indexHtml).toContain("Field Notes");
    expect(indexHtml).toContain("2026-07-20-seed-post.html");
    expect(indexHtml).toContain(
      "Why a publisher blog, not another docs folder",
    );
  });

  it("uses blog.css without regressing landing.css source", () => {
    expect(indexHtml).toMatch(/href="\.\.\/assets\/blog\.css"/);
    expect(indexHtml).toMatch(/href="\.\.\/assets\/landing\.css"/);

    const landingCss = fs.readFileSync(
      path.join(projectRoot, "site/assets/landing.css"),
      "utf8",
    );
    expect(landingCss).not.toContain(".blog-post-body");
    expect(fs.readFileSync(blogCssPath, "utf8")).toMatch(/max-width:\s*65ch/);
  });
});

describe("S28.2 blog post page", () => {
  it("renders title, lane badge, and summary meta tags", () => {
    expect(postHtml).toContain(
      '<h1 class="blog-post-title">Why a publisher blog, not another docs folder</h1>',
    );
    expect(postHtml).toContain('data-lane="field-notes"');
    expect(postHtml).toContain("Field Notes");
    expect(postHtml).toMatch(
      /<meta name="description" content="specwiki already generates wikis from your repo — the blog is editorial voice for why that matters today\."/,
    );
    expect(postHtml).toMatch(
      /<meta property="og:description" content="specwiki already generates wikis from your repo — the blog is editorial voice for why that matters today\."/,
    );
  });

  it("uses landing-family header chrome, not wiki Vector layout", () => {
    expect(postHtml).toMatch(/class="[^"]*specwiki-logo[^"]*"/);
    expect(postHtml).toContain("[[");
    expect(postHtml).toContain("]]");
    expect(postHtml).not.toMatch(/wiki-mock|infobox|vector/i);
  });

  it("links back to the blog index and specwiki home without root-absolute paths", () => {
    expect(postHtml).toMatch(/href="index\.html"/);
    expect(postHtml).toMatch(/href="\.\.\/index\.html"/);
    expect(postHtml).not.toMatch(/href="\//);
  });

  it("provides a skip link for keyboard users", () => {
    expect(postHtml).toMatch(/class="[^"]*skip-link[^"]*"/);
    expect(postHtml).toMatch(/href="#main-content"/);
    expect(postHtml).toMatch(/<main[^>]+id="main-content"[^>]+tabindex="-1"/);
  });
});

describe("S28.2 blog navigation chrome", () => {
  it("shows Blog and GitHub links in the header", () => {
    expect(indexHtml).toMatch(
      /<a[^>]+class="[^"]*header-link--active[^"]*"[^>]+href="index\.html"[^>]*>Blog<\/a>/,
    );
    expect(indexHtml).toMatch(
      /href="https:\/\/github\.com\/lucasviola\/specwiki"/,
    );
  });
});
