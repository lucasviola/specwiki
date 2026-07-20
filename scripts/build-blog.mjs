#!/usr/bin/env node
/**
 * Compile site/blog/*.md into static HTML under dist/landing-site/blog/.
 * Invoked from scripts/build-landing-site.mjs during npm run build:site.
 */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

marked.use({ gfm: true });

const REQUIRED_FIELDS = [
  "title",
  "date",
  "author",
  "lane",
  "summary",
  "audience",
];

const LANES = ["field-notes", "release-story", "ecosystem"];

const LANE_LABELS = {
  "field-notes": "Field Notes",
  "release-story": "Release Stories",
  ecosystem: "Ecosystem",
};

const AUDIENCES = ["alex", "jordan", "sam", "all"];

const LANE_ORDER = ["field-notes", "release-story", "ecosystem"];

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  return text;
}

function formatSourcePath(sourceDir, filename) {
  return path.join("site/blog", filename).split(path.sep).join("/");
}

export function validateFrontmatter(data, sourceLabel) {
  for (const field of REQUIRED_FIELDS) {
    const value = data[field];
    if (value === undefined || value === null) {
      throw new Error(
        `${sourceLabel}: missing required frontmatter field '${field}'`,
      );
    }
    if (typeof value === "string" && value.trim() === "") {
      throw new Error(
        `${sourceLabel}: required frontmatter field '${field}' must not be empty`,
      );
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizeDate(data.date))) {
    throw new Error(
      `${sourceLabel}: frontmatter 'date' must be YYYY-MM-DD (got '${data.date}')`,
    );
  }

  if (!LANES.includes(data.lane)) {
    throw new Error(
      `${sourceLabel}: frontmatter 'lane' must be one of ${LANES.join(", ")} (got '${data.lane}')`,
    );
  }

  if (!AUDIENCES.includes(data.audience)) {
    throw new Error(
      `${sourceLabel}: frontmatter 'audience' must be one of ${AUDIENCES.join(", ")} (got '${data.audience}')`,
    );
  }
}

function renderMarkdown(markdown) {
  return marked.parse(markdown, { async: false });
}

function renderHeader({ activeBlog = true } = {}) {
  const blogClass = activeBlog
    ? ' class="header-link header-link--active"'
    : ' class="header-link"';

  return `<a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="site-header">
      <a href="../index.html" class="specwiki-logo" aria-label="specwiki home">
        <span class="specwiki-logo-bracket" aria-hidden="true">[[</span>specwiki<span class="specwiki-logo-bracket" aria-hidden="true">]]</span>
      </a>
      <nav aria-label="Primary">
        <a${blogClass} href="index.html">Blog</a>
        <a class="header-link" href="https://github.com/lucasviola/specwiki">GitHub</a>
      </nav>
    </header>`;
}

function renderFooter() {
  return `<footer class="site-footer blog-footer">
      <p>
        <a href="index.html">All posts</a>
        <span class="footer-sep" aria-hidden="true">·</span>
        <a href="../index.html">specwiki home</a>
        <span class="footer-sep" aria-hidden="true">·</span>
        <a href="https://github.com/lucasviola/specwiki">GitHub</a>
      </p>
    </footer>`;
}

function renderPageShell({
  title,
  description,
  body,
  activeBlog = true,
  mainClass = "blog-main",
}) {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedTitle} — [[specwiki]] blog</title>
    <meta name="description" content="${escapedDescription}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <link rel="icon" href="../assets/favicon.png" type="image/png" sizes="32x32" />
    <link rel="apple-touch-icon" href="../assets/apple-touch-icon.png" sizes="180x180" />
    <link rel="stylesheet" href="../assets/landing.css" />
    <link rel="stylesheet" href="../assets/blog.css" />
  </head>
  <body>
    ${renderHeader({ activeBlog })}
    <main id="main-content" class="${mainClass}" tabindex="-1">
${body}
    </main>
    ${renderFooter()}
  </body>
</html>
`;
}

function renderPostPage(post) {
  const laneLabel = LANE_LABELS[post.lane];
  const article = `<article class="blog-post">
        <p class="blog-meta">
          <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
          <span class="blog-meta-sep" aria-hidden="true">·</span>
          <span>${escapeHtml(post.author)}</span>
          <span class="blog-meta-sep" aria-hidden="true">·</span>
          <span class="blog-lane-badge" data-lane="${escapeHtml(post.lane)}">${escapeHtml(laneLabel)}</span>
        </p>
        <h1 class="blog-post-title">${escapeHtml(post.title)}</h1>
        <div class="blog-post-body">
${post.htmlBody}
        </div>
      </article>`;

  return renderPageShell({
    title: post.title,
    description: post.summary,
    body: article,
  });
}

function renderIndexPage(posts) {
  const sections = LANE_ORDER.map((lane) => {
    const lanePosts = posts
      .filter((post) => post.lane === lane)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (lanePosts.length === 0) {
      return "";
    }

    const cards = lanePosts
      .map(
        (post) => `<li class="blog-card">
              <a class="blog-card-link" href="${escapeHtml(post.htmlName)}">
                <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
                <p class="blog-card-summary">${escapeHtml(post.summary)}</p>
                <p class="blog-card-meta">
                  <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
                  <span class="blog-meta-sep" aria-hidden="true">·</span>
                  <span>${escapeHtml(post.author)}</span>
                </p>
              </a>
            </li>`,
      )
      .join("\n            ");

    return `<section class="blog-lane" aria-labelledby="lane-${lane}">
          <h2 id="lane-${lane}" class="blog-lane-title">${escapeHtml(LANE_LABELS[lane])}</h2>
          <ul class="blog-card-list">
            ${cards}
          </ul>
        </section>`;
  })
    .filter(Boolean)
    .join("\n        ");

  const body = `<div class="blog-index">
        <header class="blog-index-header">
          <h1 class="blog-index-title">[[specwiki]] blog</h1>
          <p class="blog-index-lede">Field notes, release stories, and ecosystem context for specwiki — publisher voice, not your project wiki.</p>
        </header>
        ${sections}
      </div>`;

  return renderPageShell({
    title: "Blog",
    description:
      "Field notes, release stories, and ecosystem context from the specwiki team.",
    body,
    mainClass: "blog-main blog-main--index",
  });
}

export async function loadPosts(sourceDir) {
  let entries;
  try {
    entries = await fs.readdir(sourceDir, { withFileTypes: true });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "ENOENT"
    ) {
      return [];
    }
    throw err;
  }

  const posts = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    if (entry.name.startsWith("_")) {
      continue;
    }

    const sourceLabel = formatSourcePath(sourceDir, entry.name);
    const filePath = path.join(sourceDir, entry.name);
    const raw = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(raw);

    validateFrontmatter(data, sourceLabel);

    const htmlName = entry.name.replace(/\.md$/, ".html");
    posts.push({
      title: String(data.title).trim(),
      date: normalizeDate(data.date),
      author: String(data.author).trim(),
      lane: data.lane,
      summary: String(data.summary).trim(),
      audience: data.audience,
      htmlName,
      htmlBody: renderMarkdown(content.trim()),
    });
  }

  return posts;
}

export async function buildBlog({ sourceDir, outputDir }) {
  const posts = await loadPosts(sourceDir);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "index.html"),
    renderIndexPage(posts),
    "utf8",
  );

  for (const post of posts) {
    await fs.writeFile(
      path.join(outputDir, post.htmlName),
      renderPostPage(post),
      "utf8",
    );
  }

  return posts;
}
