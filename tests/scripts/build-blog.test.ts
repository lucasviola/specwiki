import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildBlog,
  escapeHtml,
  loadPosts,
  validateFrontmatter,
} from "../../scripts/build-blog.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const scriptPath = path.join(projectRoot, "scripts/build-landing-site.mjs");
const blogSourceDir = path.join(projectRoot, "site/blog");

function runBuildScript(outputDir: string): void {
  execFileSync("node", [scriptPath, `--output=${outputDir}`], {
    cwd: projectRoot,
    stdio: "pipe",
  });
}

describe("build-blog helpers", () => {
  it("escapes HTML in titles and attributes", () => {
    expect(escapeHtml(`Tom & Jerry "quotes"`)).toBe(
      "Tom &amp; Jerry &quot;quotes&quot;",
    );
  });

  it("normalizes Date frontmatter with local calendar parts", () => {
    expect(() =>
      validateFrontmatter(
        {
          title: "Hello",
          date: new Date(2026, 6, 20),
          author: "Lucas",
          lane: "field-notes",
          summary: "Summary",
          audience: "all",
        },
        "site/blog/local-date.md",
      ),
    ).not.toThrow();
  });

  it("rejects missing required frontmatter with an actionable path", () => {
    expect(() =>
      validateFrontmatter({ title: "Hello" }, "site/blog/bad-post.md"),
    ).toThrow(
      "site/blog/bad-post.md: missing required frontmatter field 'date'",
    );
  });

  it("rejects invalid lane enums", () => {
    expect(() =>
      validateFrontmatter(
        {
          title: "Hello",
          date: "2026-07-20",
          author: "Lucas",
          lane: "hot-takes",
          summary: "Summary",
          audience: "all",
        },
        "site/blog/bad-post.md",
      ),
    ).toThrow(
      "site/blog/bad-post.md: frontmatter 'lane' must be one of field-notes, release-story, ecosystem",
    );
  });
});

describe("build-blog", () => {
  let tempOutputDir: string;
  let tempSourceDir: string;

  beforeEach(() => {
    tempOutputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "specwiki-blog-build-"),
    );
    tempSourceDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "specwiki-blog-source-"),
    );
  });

  afterEach(() => {
    fs.rmSync(tempOutputDir, { recursive: true, force: true });
    fs.rmSync(tempSourceDir, { recursive: true, force: true });
  });

  it("loads published posts and skips _-prefixed templates", async () => {
    fs.writeFileSync(
      path.join(tempSourceDir, "_template.md"),
      `---
title: Template
date: 2026-07-20
author: Lucas
lane: field-notes
summary: Hidden
audience: all
---
`,
    );
    fs.writeFileSync(
      path.join(tempSourceDir, "2026-07-20-valid-post.md"),
      `---
title: Valid post
date: 2026-07-20
author: Lucas
lane: field-notes
summary: One sentence summary.
audience: all
---

Body copy.
`,
    );

    const posts = await loadPosts(tempSourceDir);
    expect(posts).toHaveLength(1);
    expect(posts[0]?.title).toBe("Valid post");
    expect(posts[0]?.date).toBe("2026-07-20");
  });

  it("builds post HTML and index for a valid post", async () => {
    fs.writeFileSync(
      path.join(tempSourceDir, "2026-07-20-valid-post.md"),
      `---
title: Valid post
date: 2026-07-20
author: Lucas
lane: field-notes
summary: One sentence summary.
audience: all
---

Body copy.
`,
    );

    await buildBlog({
      sourceDir: tempSourceDir,
      outputDir: tempOutputDir,
    });

    const postPath = path.join(tempOutputDir, "2026-07-20-valid-post.html");
    const indexPath = path.join(tempOutputDir, "index.html");

    expect(fs.existsSync(postPath)).toBe(true);
    expect(fs.existsSync(indexPath)).toBe(true);

    const postHtml = fs.readFileSync(postPath, "utf8");
    expect(postHtml).toContain('<h1 class="blog-post-title">Valid post</h1>');
    expect(postHtml).toContain("Body copy.");
    expect(postHtml).toContain(
      '<meta name="description" content="One sentence summary."',
    );

    const indexHtml = fs.readFileSync(indexPath, "utf8");
    expect(indexHtml).toContain("Field Notes");
    expect(indexHtml).toContain("2026-07-20-valid-post.html");
  });

  it("removes stale post HTML from previous builds", async () => {
    fs.writeFileSync(
      path.join(tempOutputDir, "2026-07-19-retired-post.html"),
      "<html>stale</html>",
    );
    fs.writeFileSync(
      path.join(tempSourceDir, "2026-07-20-valid-post.md"),
      `---
title: Valid post
date: 2026-07-20
author: Lucas
lane: field-notes
summary: One sentence summary.
audience: all
---

Body copy.
`,
    );

    await buildBlog({
      sourceDir: tempSourceDir,
      outputDir: tempOutputDir,
    });

    expect(
      fs.existsSync(path.join(tempOutputDir, "2026-07-19-retired-post.html")),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(tempOutputDir, "2026-07-20-valid-post.html")),
    ).toBe(true);
  });

  it("fails the build on invalid frontmatter with an actionable message", async () => {
    fs.writeFileSync(
      path.join(tempSourceDir, "2026-07-20-invalid-post.md"),
      `---
title: Missing lane
date: 2026-07-20
author: Lucas
summary: Summary without lane.
audience: all
---
`,
    );

    await expect(
      buildBlog({
        sourceDir: tempSourceDir,
        outputDir: tempOutputDir,
      }),
    ).rejects.toThrow(/missing required frontmatter field 'lane'/);
  });
});

describe("build-landing-site blog integration", () => {
  let tempOutputDir: string;

  beforeEach(() => {
    tempOutputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "specwiki-landing-blog-"),
    );
  });

  afterEach(() => {
    fs.rmSync(tempOutputDir, { recursive: true, force: true });
  });

  it("generates blog HTML from site/blog without copying source markdown", () => {
    runBuildScript(tempOutputDir);

    const postPath = path.join(tempOutputDir, "blog/2026-07-20-seed-post.html");
    const indexPath = path.join(tempOutputDir, "blog/index.html");
    const sourceMdPath = path.join(
      tempOutputDir,
      "blog/2026-07-20-seed-post.md",
    );

    expect(fs.existsSync(postPath)).toBe(true);
    expect(fs.existsSync(indexPath)).toBe(true);
    expect(fs.existsSync(sourceMdPath)).toBe(false);
    expect(fs.existsSync(path.join(tempOutputDir, "assets/blog.css"))).toBe(
      true,
    );
  });

  it("uses existing gray-matter and marked dependencies only", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    );

    expect(pkg.dependencies["gray-matter"]).toBeDefined();
    expect(pkg.dependencies["marked"]).toBeDefined();
    expect(fs.existsSync(blogSourceDir)).toBe(true);
  });
});
