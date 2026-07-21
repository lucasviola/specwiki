/**
 * Inject hero example metadata from examples/manifest.yaml into built landing HTML.
 * Keeps §04 copy in sync with the manifest at build time (S27.4).
 */
import { getHeroExample } from "./lib/examples-manifest.mjs";

const GITHUB_TREE_BASE = "https://github.com/lucasviola/specwiki/tree/main";

/**
 * @param {string} heroSlug
 */
export function buildHeroWikiHref(heroSlug) {
  return `examples/${heroSlug}/html/index.html`;
}

/**
 * @param {{ slug: string, landing: { section_prose: string } }} hero
 */
export function formatLandingSectionProseHtml(hero) {
  const slugPath = `examples/${hero.slug}`;
  const prose = hero.landing.section_prose.trim();

  if (!prose.startsWith(slugPath)) {
    throw new Error(
      `hero landing prose must start with '${slugPath}' for link injection`,
    );
  }

  const githubUrl = `${GITHUB_TREE_BASE}/${slugPath}`;
  const linkedSlug = `<a href="${githubUrl}"><code>${slugPath}</code></a>`;
  return `${linkedSlug}${prose.slice(slugPath.length)}`;
}

/**
 * @param {string} html
 * @param {import("./lib/examples-manifest.mjs").ExamplesManifest} manifest
 */
export function injectLandingExampleFromManifest(html, manifest) {
  const hero = getHeroExample(manifest);
  const wikiHref = buildHeroWikiHref(hero.slug);
  const sectionProseHtml = formatLandingSectionProseHtml(hero);

  let result = html.replace(
    /(<h2 id="example-title" class="section-title">)[\s\S]*?(<\/h2>)/,
    `$1${hero.landing.section_title}$2`,
  );

  result = result.replace(
    /(<section class="section" aria-labelledby="example-title">[\s\S]*?<p class="section-prose">)[\s\S]*?(<\/p>)/,
    `$1${sectionProseHtml}$2`,
  );

  result = result.replace(
    /(<a[^>]+class="[^"]*example-live-link[^"]*"[^>]+href=")[^"]*(")/g,
    `$1${wikiHref}$2`,
  );

  return result;
}
