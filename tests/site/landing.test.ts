import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

let html: string;
let css: string;

beforeAll(() => {
  html = fs.readFileSync(path.join(projectRoot, "site/index.html"), "utf8");
  css = fs.readFileSync(
    path.join(projectRoot, "site/assets/landing.css"),
    "utf8",
  );
});

describe("S20.1 landing page — narrative", () => {
  it("hero h1 states the exact value proposition", () => {
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
    expect(h1, "page must contain an <h1>").not.toBeNull();
    expect(h1![1].replace(/<[^>]+>/g, "").trim()).toBe(
      "Make AI knowledge useful to humans.",
    );
  });

  it("has exactly one h1", () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it("explains the problem, the approach, and the human outcome", () => {
    const text = html.replace(/\s+/g, " ");
    expect(text).toMatch(/hard for people to find and understand/i);
    expect(text).toMatch(/navigable wiki/i);
    expect(text).toMatch(/shared, usable understanding/i);
  });

  it("primary CTA links to the confirmed GitHub repository", () => {
    expect(html).toMatch(
      /<a[^>]+href="https:\/\/github\.com\/lucasviola\/specwiki"[^>]*>/,
    );
  });

  it("does not reference an npm install path before the package is published", () => {
    expect(html).not.toMatch(/npm\s+(install|i)\s+(-g\s+)?specwiki/);
  });
});

describe("S20.1 landing page — brand treatment", () => {
  it("header renders the canonical lowercase [[specwiki]] wordmark", () => {
    const header = /<header[\s\S]*?<\/header>/.exec(html);
    expect(header, "page must contain a <header>").not.toBeNull();
    expect(header![0]).toContain("[[");
    expect(header![0]).toContain("specwiki");
    expect(header![0]).toContain("]]");
  });

  it("never uses 'Spec Wiki' title case in product chrome", () => {
    expect(html).not.toMatch(/Spec\s+Wiki/);
    expect(html).not.toContain("SpecWiki</h1>");
  });

  it("logo has an accessible name and decorative brackets are hidden from AT", () => {
    const logo = /<a[^>]*class="[^"]*specwiki-logo[^"]*"[^>]*>/.exec(html);
    expect(logo, "wordmark must be a .specwiki-logo link").not.toBeNull();
    expect(logo![0]).toMatch(/aria-label="[^"]*specwiki[^"]*"/);
    expect(html).toMatch(
      /<span[^>]*class="[^"]*specwiki-logo-bracket[^"]*"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*class="[^"]*specwiki-logo-bracket/,
    );
  });

  it("CSS uses only canonical light-theme brand tokens", () => {
    expect(css).toContain("#202122");
    expect(css).toContain("#3366cc");
    expect(css).toContain("#ffffff");
  });

  it("CSS provides the canonical dark-theme token pair", () => {
    expect(css).toMatch(/prefers-color-scheme:\s*dark/);
    expect(css).toContain("#eaecf0");
    expect(css).toContain("#6b8fe8");
    expect(css).toContain("#16181c");
  });

  it("wordmark uses the documented monospace stack at weight 700 with clear space", () => {
    expect(css).toMatch(/\.specwiki-logo[\s\S]*?ui-monospace/);
    expect(css).toMatch(/\.specwiki-logo[\s\S]*?font-weight:\s*700/);
    expect(css).toMatch(/\.specwiki-logo[\s\S]*?(margin|padding):\s*1em/);
  });

  it("page pulls no web fonts or CDN assets", () => {
    expect(html).not.toMatch(/https?:\/\/(fonts|cdn|unpkg|jsdelivr)/);
    expect(css).not.toMatch(/@import|@font-face/);
  });
});
