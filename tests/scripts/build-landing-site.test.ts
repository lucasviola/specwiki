import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const scriptPath = path.join(projectRoot, "scripts/build-landing-site.mjs");
const defaultOutputDir = path.join(projectRoot, "dist/landing-site");

function runBuildScript(outputDir: string): void {
  execFileSync("node", [scriptPath, `--output=${outputDir}`], {
    cwd: projectRoot,
    stdio: "pipe",
  });
}

describe("build-landing-site", () => {
  let tempOutputDir: string;

  beforeEach(() => {
    tempOutputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "specwiki-landing-site-"),
    );
  });

  afterEach(() => {
    fs.rmSync(tempOutputDir, { recursive: true, force: true });
    if (fs.existsSync(defaultOutputDir)) {
      fs.rmSync(defaultOutputDir, { recursive: true, force: true });
    }
  });

  it("defines a build script at scripts/build-landing-site.mjs", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it("copies index.html and assets into the output directory", () => {
    runBuildScript(tempOutputDir);

    expect(fs.existsSync(path.join(tempOutputDir, "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(tempOutputDir, "assets/landing.css"))).toBe(
      true,
    );
  });

  it("omits CNAME by default so GitHub Pages serves at lucasviola.github.io/specwiki", () => {
    runBuildScript(tempOutputDir);

    expect(fs.existsSync(path.join(tempOutputDir, "CNAME"))).toBe(false);
    expect(fs.existsSync(path.join(tempOutputDir, "index.html"))).toBe(true);
  });

  it("writes a CNAME when --with-cname is passed (after specwiki.ai is owned)", () => {
    execFileSync(
      "node",
      [scriptPath, `--output=${tempOutputDir}`, "--with-cname"],
      {
        cwd: projectRoot,
        stdio: "pipe",
      },
    );

    const cname = fs.readFileSync(path.join(tempOutputDir, "CNAME"), "utf8");
    expect(cname.trim()).toBe("specwiki.ai");
  });

  it("writes .nojekyll so GitHub Pages skips Jekyll processing", () => {
    runBuildScript(tempOutputDir);

    expect(fs.existsSync(path.join(tempOutputDir, ".nojekyll"))).toBe(true);
  });

  it("defaults output to dist/landing-site when no flag is passed", () => {
    runBuildScript(defaultOutputDir);

    expect(fs.existsSync(path.join(defaultOutputDir, "index.html"))).toBe(true);
  });
});
