import fs from "node:fs/promises";
import path from "node:path";

export class PathEscapeError extends Error {
  readonly label: string;

  constructor(label: string) {
    super("Output directory must stay within project root");
    this.name = "PathEscapeError";
    this.label = label;
  }
}

export function assertConfinedUnder(
  root: string,
  target: string,
  label: string,
): void {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new PathEscapeError(label);
  }
}

export async function assertRealpathConfinedUnder(
  root: string,
  target: string,
  label: string,
): Promise<void> {
  try {
    const realRoot = await fs.realpath(root);
    const realTarget = await fs.realpath(target);
    const relative = path.relative(realRoot, realTarget);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new PathEscapeError(label);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    if (err instanceof PathEscapeError) {
      throw err;
    }
    throw err;
  }
}

export async function resolveOutputWithinProject(
  projectRoot: string,
  outputDir: string,
): Promise<string> {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedOutput = path.resolve(resolvedProjectRoot, outputDir);

  assertConfinedUnder(resolvedProjectRoot, resolvedOutput, "output directory");
  await assertRealpathConfinedUnder(
    resolvedProjectRoot,
    resolvedOutput,
    "output directory",
  );

  return resolvedOutput;
}
