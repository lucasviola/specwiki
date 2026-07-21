/**
 * Guard subpath-safe static hosting — reject root-absolute href="/… and src="/… in HTML.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT_ABSOLUTE_ATTR_RE = /\b(?:href|src)\s*=\s*(["'])\/(?!\/)/;

/**
 * @param {string} html
 * @param {string} label — file path for error messages
 */
export function assertNoRootAbsoluteUrlsInHtml(html, label) {
  if (ROOT_ABSOLUTE_ATTR_RE.test(html)) {
    throw new Error(
      `${label}: contains root-absolute href="/ or src="/ (breaks subpath hosting)`,
    );
  }
}

/**
 * @param {string} dir — directory to scan recursively
 */
export async function assertNoRootAbsoluteUrlsInHtmlTree(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await assertNoRootAbsoluteUrlsInHtmlTree(entryPath);
      continue;
    }
    if (!entry.name.endsWith(".html")) {
      continue;
    }
    const html = await fs.readFile(entryPath, "utf8");
    assertNoRootAbsoluteUrlsInHtml(html, entryPath);
  }
}
