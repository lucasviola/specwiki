import fs from "node:fs/promises";
import path from "node:path";

export interface WikiCompareResult {
  fresh: boolean;
  diffCount: number;
  fileCount: number;
  missing: string[];
  extra: string[];
  changed: string[];
}

async function collectFiles(
  rootDir: string,
  prefix = "",
): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  let entries;
  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true });
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return files;
    }
    throw err;
  }

  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectFiles(absolutePath, relativePath);
      for (const [nestedPath, content] of nested) {
        files.set(nestedPath, content);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    files.set(relativePath, await fs.readFile(absolutePath, "utf-8"));
  }

  return files;
}

export async function compareWikiOutput(
  expectedRoot: string,
  actualRoot: string,
): Promise<WikiCompareResult> {
  const expected = await collectFiles(expectedRoot);
  const actual = await collectFiles(actualRoot);

  const missing: string[] = [];
  const changed: string[] = [];

  for (const [relativePath, expectedContent] of expected) {
    const actualContent = actual.get(relativePath);
    if (actualContent === undefined) {
      missing.push(relativePath);
      continue;
    }
    if (actualContent !== expectedContent) {
      changed.push(relativePath);
    }
  }

  const extra: string[] = [];
  for (const relativePath of actual.keys()) {
    if (!expected.has(relativePath)) {
      extra.push(relativePath);
    }
  }

  missing.sort();
  extra.sort();
  changed.sort();

  const diffCount = missing.length + extra.length + changed.length;

  return {
    fresh: diffCount === 0,
    diffCount,
    fileCount: expected.size,
    missing,
    extra,
    changed,
  };
}

export async function directoryHasWikiFiles(rootDir: string): Promise<boolean> {
  const files = await collectFiles(rootDir);
  return files.size > 0;
}
