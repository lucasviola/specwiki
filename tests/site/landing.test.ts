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
// Prettier wraps HTML text across lines — normalize whitespace before
// asserting verbatim narrative copy.
let text: string;

beforeAll(() => {
  html = fs.readFileSync(path.join(projectRoot, "site/index.html"), "utf8");
  css = fs.readFileSync(
    path.join(projectRoot, "site/assets/landing.css"),
    "utf8",
  );
  text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s+/g, " ");
});

describe("S20.1 v2 landing page — hero narrative (AC 1–2)", () => {
  it("hero h1 states the exact value proposition", () => {
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
    expect(h1, "page must contain an <h1>").not.toBeNull();
    expect(
      h1![1]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    ).toBe("Make AI knowledge useful to humans.");
  });

  it("has exactly one h1", () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });
});

describe("S20.1 v2 landing page — hero quick start and agent prompt (AC 3)", () => {
  it("shows the npx quick-start command in a terminal block", () => {
    expect(text).toContain(
      "npx @lucasviola/specwiki generate && npx @lucasviola/specwiki open",
    );
    expect(html).toMatch(/class="[^"]*terminal[^"]*"/);
  });

  it("shows the global install command", () => {
    expect(text).toContain("npm install -g @lucasviola/specwiki");
  });

  it("provides a copy-pasteable agent install prompt", () => {
    expect(text).toMatch(/paste this into your agent/i);
    expect(text).toContain("Install specwiki in this repo");
    expect(text).toContain("summarize the generated wiki index");
  });

  it("adds copy-to-clipboard buttons for quick start and agent prompt", () => {
    expect(html).toMatch(
      /<button[^>]+class="[^"]*copy-btn[^"]*"[^>]*data-copy-target="quick-start-npx"/,
    );
    expect(html).toMatch(
      /<button[^>]+class="[^"]*copy-btn[^"]*"[^>]*data-copy-target="quick-start-global"/,
    );
    expect(html).toMatch(
      /<button[^>]+class="[^"]*copy-btn[^"]*"[^>]*data-copy-target="agent-prompt-code"/,
    );
    expect(html).toMatch(/id="quick-start-npx"/);
    expect(html).toMatch(/id="quick-start-global"/);
    expect(html).toMatch(/id="agent-prompt-code"/);
    expect(html).toMatch(
      /<script[^>]+src="assets\/landing\.js"[^>]*><\/script>/,
    );
  });

  it("places quick-start copy buttons next to each install comment", () => {
    expect(html).toMatch(
      /# Try without installing[\s\S]*?data-copy-target="quick-start-npx"/,
    );
    expect(html).toMatch(
      /# Or install globally[\s\S]*?data-copy-target="quick-start-global"/,
    );
    expect(html).toMatch(/aria-label="Copy try without installing commands"/);
    expect(html).toMatch(/aria-label="Copy global install command"/);
  });
});

describe("landing page — copy-to-clipboard behaviour", () => {
  let landingJs: string;

  beforeAll(() => {
    landingJs = fs.readFileSync(
      path.join(projectRoot, "site/assets/landing.js"),
      "utf8",
    );
  });

  it("styles the copy button and copied feedback state", () => {
    expect(css).toMatch(/\.copy-btn\s*\{/);
    expect(css).toMatch(/\.copy-btn:focus-visible/);
    expect(css).toMatch(/\.copy-btn\.is-copied/);
  });

  it("writes clipboard text from the target code block", () => {
    expect(landingJs).toMatch(/navigator\.clipboard\.writeText/);
    expect(landingJs).toMatch(/data-copy-target/);
    expect(landingJs).toMatch(/textContent/);
    expect(landingJs).toMatch(/is-copied/);
  });

  it("falls back to execCommand when clipboard.writeText rejects", () => {
    expect(landingJs).toMatch(/\.catch\s*\(/);
    expect(landingJs).toMatch(/execCommand\s*\(\s*["']copy["']\s*\)/);
  });

  it("announces copy feedback without masking the control name", () => {
    expect(html).toMatch(
      /id="copy-status"[^>]*aria-live="polite"|aria-live="polite"[^>]*id="copy-status"/,
    );
    expect(landingJs).toMatch(/setAttribute\(\s*["']aria-label["']/);
    expect(landingJs).toMatch(/clearTimeout|clearFeedbackTimer/);
  });
});

describe("S20.1 v2 landing page — CTA (AC 7)", () => {
  it("primary CTA links to the confirmed GitHub repository", () => {
    expect(html).toMatch(
      /<a[^>]+href="https:\/\/github\.com\/lucasviola\/specwiki"[^>]*>/,
    );
  });

  it("does not link to an npm package page before publication", () => {
    expect(html).not.toMatch(/npmjs\.com/);
  });
});

describe("S20.1 v2 landing page — problem section (AC 4)", () => {
  it("names the scattered tool conventions", () => {
    expect(text).toContain("AGENTS.md");
    expect(text).toContain("CLAUDE.md");
    expect(text).toContain(".cursor/rules/");
    expect(text).toContain("_bmad-output/");
  });

  it("includes the README what-it-finds coverage", () => {
    expect(text).toContain("openspec/");
    expect(text).toContain(".kiro/specs/");
    expect(text).toContain(".github/copilot-instructions.md");
  });
});

describe("S20.1 v2 landing page — how it works (AC 5)", () => {
  it("presents the discover → generate → open mechanism", () => {
    expect(text).toMatch(/discover/i);
    expect(text).toMatch(/generate/i);
    expect(text).toMatch(/\bopen\b/i);
  });

  it("states the self-contained, no-server facts", () => {
    expect(text).toMatch(/self-contained/i);
    expect(text).toMatch(/no server/i);
    expect(text).toContain("file://");
  });
});

describe("S20.1 v2 landing page — live example (AC 6)", () => {
  it("shows the real generate/open commands for the example project", () => {
    expect(text).toContain(
      "npx @lucasviola/specwiki generate --project examples/agent-harness-parcel",
    );
    expect(text).toContain(
      "npx @lucasviola/specwiki open --project examples/agent-harness-parcel",
    );
  });

  it("lists the three input files of the agent harness example", () => {
    expect(text).toContain("README.md");
    expect(text).toContain("AGENTS.md");
    expect(text).toContain("CLAUDE.md");
  });

  it("renders a static wiki-mock panel, not an iframe or embed", () => {
    expect(html).toMatch(/class="[^"]*wiki-mock[^"]*"/);
    expect(html).not.toMatch(/<iframe/i);
  });

  it("wiki mock mirrors the real generated index (Main Page portal heading)", () => {
    const mockBody = /<div class="wiki-mock-body">[\s\S]*?<\/div>/.exec(html);
    expect(mockBody, "wiki mock must have a body panel").not.toBeNull();
    expect(mockBody![0]).toContain("Main Page");
    expect(mockBody![0]).toContain("Parcel Path (mock)");
  });

  it("names the example directory link to its actual subfolder", () => {
    expect(html).toMatch(
      /href="https:\/\/github\.com\/lucasviola\/specwiki\/tree\/main\/examples\/agent-harness-parcel"/,
    );
  });

  it("states the repo-root prerequisite for the example commands", () => {
    expect(text).toMatch(/from the specwiki repo root/i);
  });

  it("links to the examples folder on GitHub", () => {
    expect(html).toMatch(
      /href="https:\/\/github\.com\/lucasviola\/specwiki\/tree\/main\/examples"/,
    );
  });
});

describe("S20.1 v2 landing page — brand treatment (AC 8–9)", () => {
  it("header renders the canonical lowercase [[specwiki]] wordmark", () => {
    const header = /<header[\s\S]*?<\/header>/.exec(html);
    expect(header, "page must contain a <header>").not.toBeNull();
    expect(header![0]).toContain("[[");
    expect(header![0]).toContain("specwiki");
    expect(header![0]).toContain("]]");
  });

  it("wordmark home link uses index.html, not a root-absolute path", () => {
    const logo = /<a[^>]*class="[^"]*specwiki-logo[^"]*"[^>]*>/.exec(html);
    expect(logo, "wordmark must be a .specwiki-logo link").not.toBeNull();
    expect(logo![0]).toContain('href="index.html"');
    expect(logo![0]).not.toContain('href="/"');
  });

  it("never uses 'Spec Wiki' title case in product chrome", () => {
    expect(html).not.toMatch(/Spec\s+Wiki/);
  });

  it("logo has an accessible name and decorative brackets are hidden from AT", () => {
    const logo = /<a[^>]*class="[^"]*specwiki-logo[^"]*"[^>]*>/.exec(html);
    expect(logo![0]).toMatch(/aria-label="[^"]*specwiki[^"]*"/);
    const brackets = html.match(
      /<span[^>]*class="[^"]*specwiki-logo-bracket[^"]*"[^>]*>/g,
    );
    expect(brackets, "brackets must be spans").not.toBeNull();
    for (const bracket of brackets!) {
      expect(bracket).toContain('aria-hidden="true"');
    }
  });

  it("wordmark uses the documented monospace stack at weight 700 with clear space", () => {
    expect(css).toMatch(/\.specwiki-logo[\s\S]*?ui-monospace/);
    expect(css).toMatch(/\.specwiki-logo[\s\S]*?font-weight:\s*700/);
    expect(css).toMatch(/\.specwiki-logo[\s\S]*?(margin|padding):\s*1em/);
  });

  it("head links the round brand icon as favicon and apple-touch-icon", () => {
    expect(html).toMatch(
      /<link[^>]+rel="icon"[^>]+href="assets\/favicon\.png"/,
    );
    expect(html).toMatch(
      /<link[^>]+rel="apple-touch-icon"[^>]+href="assets\/apple-touch-icon\.png"/,
    );
    expect(
      fs.existsSync(path.join(projectRoot, "site/assets/favicon.png")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(projectRoot, "site/assets/apple-touch-icon.png")),
    ).toBe(true);
  });
});

describe("S20.1 v2 landing page — dark-first design tokens (AC 11–12)", () => {
  it(":root defaults to the canonical dark token set", () => {
    const root = /:root\s*\{([\s\S]*?)\}/.exec(css);
    expect(root, "CSS must define :root tokens").not.toBeNull();
    expect(root![1]).toContain("#eaecf0");
    expect(root![1]).toContain("#6b8fe8");
    expect(root![1]).toContain("#16181c");
  });

  it("light tokens back a prefers-color-scheme: light override", () => {
    expect(css).toMatch(/prefers-color-scheme:\s*light/);
    expect(css).toContain("#202122");
    expect(css).toContain("#3366cc");
    expect(css).toContain("#ffffff");
  });

  it("page pulls no web fonts, CDN assets, or external scripts", () => {
    expect(html).not.toMatch(/https?:\/\/(fonts|cdn|unpkg|jsdelivr)/);
    expect(css).not.toMatch(/@import|@font-face/);
    const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/gi)].map(
      (match) => match[1],
    );
    for (const src of scriptSrcs) {
      expect(src).toMatch(/^assets\//);
      expect(src).not.toMatch(/^https?:\/\//i);
    }
  });

  it("all product claims stay supportable — no invented metrics", () => {
    expect(text).not.toMatch(/\d+ (stars|users|downloads)/i);
    expect(text).not.toMatch(/testimonial/i);
  });
});

describe("S20.2 landing page — semantic structure and no-JS core (AC 1, 4–5)", () => {
  it("uses header, main, and footer landmarks", () => {
    expect(html).toMatch(/<header[\s>]/);
    expect(html).toMatch(/<main[\s>]/);
    expect(html).toMatch(/<footer[\s>]/);
  });

  it("delivers the value proposition and primary CTA without JavaScript", () => {
    // Progressive-enhancement copy script is allowed; core content must be
    // present in the static HTML (not injected by JS).
    expect(html).toMatch(/<h1[\s>]/);
    expect(html).toMatch(/class="[^"]*cta[^"]*"/);
    expect(text).toContain("Make AI knowledge useful to humans.");
    expect(html).toMatch(/id="quick-start-npx"/);
    expect(html).toMatch(/id="quick-start-global"/);
    expect(html).toMatch(/id="agent-prompt-code"/);
    const scripts = html.match(/<script\b/gi) ?? [];
    expect(scripts).toHaveLength(1);
    expect(html).toMatch(/src="assets\/landing\.js"/);
  });

  it("primary nav has an accessible name", () => {
    expect(html).toMatch(/<nav[^>]+aria-label="/);
  });
});

describe("S20.2 landing page — keyboard focus and skip link (AC 1)", () => {
  it("CSS defines visible :focus-visible outlines on interactive elements", () => {
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/outline:\s*2px solid var\(--color-primary\)/);
  });

  it("provides a skip link to main content", () => {
    expect(html).toMatch(/class="[^"]*skip-link[^"]*"/);
    expect(html).toMatch(/href="#main-content"/);
    expect(html).toMatch(/<main[^>]+id="main-content"[^>]+tabindex="-1"/);
  });
});

describe("S20.2 landing page — responsive overflow containment (AC 2)", () => {
  it("wraps the coverage table in a horizontal scroll container", () => {
    expect(html).toMatch(/class="[^"]*coverage-table-wrap[^"]*"/);
    expect(css).toMatch(/\.coverage-table-wrap[\s\S]*?overflow-x:\s*auto/);
  });

  it("uses min() in grid minmax so panels fit within 320px viewports", () => {
    expect(css).toMatch(/minmax\(min\(100%/);
  });

  it("constrains terminal and file-tree overflow locally", () => {
    expect(css).toMatch(/\.terminal-body[\s\S]*?overflow-x:\s*auto/);
    expect(css).toMatch(/\.terminal-snippet pre[\s\S]*?overflow-x:\s*auto/);
    expect(css).toMatch(/\.file-tree[\s\S]*?overflow-x:\s*auto/);
  });

  it("includes a narrow-viewport layout adjustment", () => {
    expect(css).toMatch(/@media\s*\(max-width:/);
  });

  it("does not rely on page-level overflow-x: hidden as the primary fix", () => {
    expect(css).not.toMatch(/body\s*\{[\s\S]*?overflow-x:\s*hidden/);
  });
});

describe("S20.2 landing page — contrast and motion (AC 1, 3)", () => {
  it("uses muted text at sufficient opacity for WCAG AA body copy", () => {
    const mutedMatches = css.match(/--text-muted:\s*rgba\([^)]+\)/g);
    expect(mutedMatches, "CSS must define --text-muted tokens").not.toBeNull();
    for (const token of mutedMatches!) {
      expect(token).toMatch(/0\.(?:7[2-9]|[89]\d)/);
    }
  });

  it("respects prefers-reduced-motion", () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it("keeps decorative wiki-mock search hidden from assistive technology", () => {
    const search = html.match(
      /class="[^"]*wiki-mock-search[^"]*"[^>]*aria-hidden="true"/,
    );
    expect(search, "wiki mock search is decorative").not.toBeNull();
  });
});
