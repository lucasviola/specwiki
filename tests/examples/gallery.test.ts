import { describe, expect, it } from "vitest";
import { renderExamplesGalleryHtml } from "../../scripts/lib/examples-gallery.mjs";

const fixtureManifest = {
  hero: "hero-demo",
  examples: [
    {
      slug: "hero-demo",
      title: 'Hero <title> & "quotes"',
      tagline: "Tagline with <em>markup</em> & ampersands",
      framework: "agent-harness",
    },
    {
      slug: "second-example",
      title: "Second example",
      tagline: "Another stack",
      framework: "bmad",
    },
    {
      slug: "third-example",
      title: "Third example",
      tagline: "Loose research",
      framework: "article-research",
    },
  ],
};

describe("renderExamplesGalleryHtml (S27.3)", () => {
  it("lists exactly one card per built catalog slug", () => {
    const html = renderExamplesGalleryHtml(fixtureManifest, {
      builtSlugs: ["hero-demo", "second-example", "third-example"],
    });

    expect(
      html.match(/<li class="gallery-card(?: gallery-card--hero)?"/g)?.length,
    ).toBe(3);
    expect(html).toContain('href="hero-demo/html/index.html"');
    expect(html).toContain('href="second-example/html/index.html"');
    expect(html).toContain('href="third-example/html/index.html"');
  });

  it("links each card with a relative slug href (no leading /)", () => {
    const html = renderExamplesGalleryHtml(fixtureManifest, {
      builtSlugs: ["hero-demo", "second-example"],
    });

    expect(html).toMatch(/href="hero-demo\/html\/index\.html"/);
    expect(html).toMatch(/href="second-example\/html\/index\.html"/);
    expect(html).not.toMatch(/href="\/[^"]+"/);
    expect(html).not.toMatch(/src="\/[^"]+"/);
  });

  it("orders the hero slug first and marks it with a hero badge", () => {
    const html = renderExamplesGalleryHtml(fixtureManifest, {
      builtSlugs: ["third-example", "hero-demo", "second-example"],
    });

    const cardHrefs = [
      ...html.matchAll(/href="([^"]+\/html\/index\.html)"/g),
    ].map((match) => match[1]);

    expect(cardHrefs[0]).toBe("hero-demo/html/index.html");
    expect(html).toMatch(/gallery-card--hero/);
    expect(html).toMatch(/gallery-hero-badge/);
    expect(html).toMatch(/Hero demo/);
  });

  it("HTML-escapes titles, taglines, frameworks, and slugs before injection", () => {
    const html = renderExamplesGalleryHtml(fixtureManifest, {
      builtSlugs: ["hero-demo"],
    });

    expect(html).toContain("Hero &lt;title&gt; &amp; &quot;quotes&quot;");
    expect(html).toContain(
      "Tagline with &lt;em&gt;markup&lt;/em&gt; &amp; ampersands",
    );
    expect(html).not.toContain("<em>markup</em>");
    expect(html).not.toContain("Hero <title>");
  });

  it("reuses shared landing chrome with relative asset paths", () => {
    const html = renderExamplesGalleryHtml(fixtureManifest, {
      builtSlugs: ["hero-demo"],
    });

    expect(html).toMatch(/class="skip-link"[^>]+href="#main-content"/);
    expect(html).toMatch(
      /class="specwiki-logo"[^>]+href="\.\.\/index\.html"|href="\.\.\/index\.html"[^>]+class="specwiki-logo"/,
    );
    expect(html).toMatch(/<nav[^>]+aria-label="Primary"/);
    expect(html).toContain('href="../assets/landing.css"');
    expect(html).toContain('href="../assets/favicon.png"');
    expect(html).toContain('href="../assets/apple-touch-icon.png"');
    expect(html).toMatch(/<footer[\s\S]*?<\/footer>/);
  });

  it("omits catalog entries that were not built", () => {
    const html = renderExamplesGalleryHtml(fixtureManifest, {
      builtSlugs: ["hero-demo"],
    });

    expect(html).toContain('href="hero-demo/html/index.html"');
    expect(html).not.toContain("second-example");
    expect(html).not.toContain("third-example");
    expect(
      html.match(/<li class="gallery-card(?: gallery-card--hero)?"/g)?.length,
    ).toBe(1);
  });

  it("contains no root-absolute href or src attributes", () => {
    const html = renderExamplesGalleryHtml(fixtureManifest, {
      builtSlugs: ["hero-demo", "second-example", "third-example"],
    });

    expect(html).not.toMatch(/\bhref="\//);
    expect(html).not.toMatch(/\bsrc="\//);
  });
});
