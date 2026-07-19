import chalk from "chalk";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { log } from "../core/Logger.js";
import { parsePatternList, validatePatternList } from "./patterns.js";

export interface SpecwikiConfig {
  patterns?: string[];
}

export interface ResolvedPatterns {
  patterns?: string[];
  configSource?: string;
}

const CONFIG_CANDIDATES = [
  "specwiki.config.js",
  "specwiki.config.json",
] as const;

const JS_CONFIG_TRUST_WARNING =
  "specwiki.config.js executes arbitrary Node.js code. Prefer specwiki.config.json for static patterns.";

let jsConfigTrustWarningEmitted = false;

export function resetJsConfigTrustWarningForTests(): void {
  jsConfigTrustWarningEmitted = false;
}

function emitJsConfigTrustWarning(sourcePath: string): void {
  if (jsConfigTrustWarningEmitted) {
    return;
  }

  jsConfigTrustWarningEmitted = true;
  process.stderr.write(chalk.yellow(`Warning: ${JS_CONFIG_TRUST_WARNING}\n`));
  log.warn("config.warn", { sourcePath });
}

function assertConfigPathWithinProject(
  projectRoot: string,
  configPath: string,
  realConfigPath: string,
): void {
  const relative = path.relative(projectRoot, realConfigPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ConfigError("Config file must stay within the project root");
  }

  if (path.basename(realConfigPath) !== path.basename(configPath)) {
    throw new ConfigError("Config file must stay within the project root");
  }
}

async function resolveConfigPath(
  projectRoot: string,
  filename: string,
): Promise<string> {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const configPath = path.join(resolvedProjectRoot, filename);
  const realProjectRoot = await fs.realpath(resolvedProjectRoot);
  const realConfigPath = await fs.realpath(configPath);
  assertConfigPathWithinProject(realProjectRoot, configPath, realConfigPath);
  return realConfigPath;
}

function loadConfigFailureMessage(
  filename: string,
  kind: "json" | "js",
): string {
  if (kind === "json") {
    return `Invalid JSON in ${filename}`;
  }
  return `Failed to load ${filename}`;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function normalizeConfig(raw: unknown): SpecwikiConfig {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ConfigError("Config must export a plain object");
  }

  const config = raw as Record<string, unknown>;
  if (config.patterns === undefined) {
    return {};
  }

  if (!Array.isArray(config.patterns)) {
    throw new ConfigError("Config patterns must be an array of glob strings");
  }

  if (!config.patterns.every((pattern) => typeof pattern === "string")) {
    throw new ConfigError("Config patterns must be an array of glob strings");
  }

  try {
    return { patterns: validatePatternList(config.patterns) };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid config patterns";
    throw new ConfigError(message);
  }
}

export async function loadProjectConfig(
  projectRoot: string,
): Promise<{ config: SpecwikiConfig; sourcePath: string } | null> {
  for (const filename of CONFIG_CANDIDATES) {
    const configPath = path.join(projectRoot, filename);

    try {
      await fs.access(configPath);
    } catch {
      continue;
    }

    try {
      const resolvedConfigPath = await resolveConfigPath(projectRoot, filename);

      if (filename.endsWith(".json")) {
        let raw: unknown;
        try {
          raw = JSON.parse(await fs.readFile(resolvedConfigPath, "utf-8"));
        } catch (err) {
          if (err instanceof SyntaxError) {
            throw new ConfigError(loadConfigFailureMessage(filename, "json"));
          }
          throw new ConfigError(loadConfigFailureMessage(filename, "json"));
        }

        return {
          config: normalizeConfig(raw),
          sourcePath: filename,
        };
      }

      let module: { default?: unknown };
      try {
        module = await import(pathToFileURL(resolvedConfigPath).href);
      } catch (err) {
        if (err instanceof SyntaxError) {
          throw new ConfigError(`Invalid JavaScript in ${filename}`);
        }
        throw new ConfigError(loadConfigFailureMessage(filename, "js"));
      }

      const exported = module.default ?? module;
      emitJsConfigTrustWarning(filename);
      return {
        config: normalizeConfig(exported),
        sourcePath: filename,
      };
    } catch (err) {
      if (err instanceof ConfigError) {
        throw err;
      }

      const kind = filename.endsWith(".json") ? "json" : "js";
      throw new ConfigError(loadConfigFailureMessage(filename, kind));
    }
  }

  return null;
}

export function resolvePatternsFromEnv(): string[] | undefined {
  const value = process.env.SPECWIKI_PATTERNS;
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  try {
    return parsePatternList(value);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid SPECWIKI_PATTERNS";
    throw new ConfigError(message);
  }
}

export async function resolveEffectivePatterns(options: {
  projectRoot: string;
  cliPatterns?: string[];
}): Promise<ResolvedPatterns> {
  if (options.cliPatterns) {
    return { patterns: options.cliPatterns };
  }

  const envPatterns = resolvePatternsFromEnv();
  if (envPatterns) {
    return { patterns: envPatterns };
  }

  const loaded = await loadProjectConfig(options.projectRoot);
  if (loaded) {
    return {
      patterns: loaded.config.patterns,
      configSource: loaded.sourcePath,
    };
  }

  return {};
}
