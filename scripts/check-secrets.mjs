#!/usr/bin/env node
/**
 * Scan staged changes for likely secrets before commit.
 * Checks added/modified lines only to reduce false positives on existing code.
 */
import { execSync } from "node:child_process";

const FORBIDDEN_BASENAMES = new Set([
  ".env",
  "credentials.json",
  "secrets.json",
  "id_rsa",
  "id_dsa",
  "id_ecdsa",
  "id_ed25519",
]);

const FORBIDDEN_SUFFIXES = [".pem", ".p12", ".pfx", ".key"];

const SECRET_PATTERNS = [
  { name: "AWS access key ID", regex: /AKIA[0-9A-Z]{16}/ },
  {
    name: "Private key block",
    regex: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
  },
  { name: "GitHub personal access token", regex: /ghp_[A-Za-z0-9]{20,}/ },
  { name: "GitHub fine-grained token", regex: /github_pat_[A-Za-z0-9_]{20,}/ },
  { name: "OpenAI API key", regex: /sk-[A-Za-z0-9]{20,}/ },
  { name: "Anthropic API key", regex: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "Stripe live secret key", regex: /sk_live_[A-Za-z0-9]{20,}/ },
  { name: "Slack token", regex: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
];

const ALLOWLIST_PATHS = [
  /^scripts\/check-secrets\.mjs$/,
  /^\.githooks\/pre-commit$/,
  /^tests\//,
  /^_bmad-output\//,
  /^HARNESS\.md$/,
  /^IMPLEMENTATION\.md$/,
];

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

function getStagedFiles() {
  const output = run("git diff --cached --name-only --diff-filter=ACM");
  if (!output) {
    return [];
  }
  return output.split("\n").filter(Boolean);
}

function isAllowlisted(path) {
  return ALLOWLIST_PATHS.some((pattern) => pattern.test(path));
}

function isForbiddenFilename(path) {
  const basename = path.split("/").pop() ?? path;
  if (FORBIDDEN_BASENAMES.has(basename)) {
    return true;
  }
  return FORBIDDEN_SUFFIXES.some((suffix) => basename.endsWith(suffix));
}

function getStagedDiff() {
  return run("git diff --cached -U0 --no-color");
}

function scanDiff(diff) {
  const findings = [];
  let currentFile = null;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice("+++ b/".length);
      continue;
    }

    if (!currentFile || isAllowlisted(currentFile)) {
      continue;
    }

    if (!line.startsWith("+") || line.startsWith("+++")) {
      continue;
    }

    const addedLine = line.slice(1);
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(addedLine)) {
        findings.push({
          file: currentFile,
          kind: pattern.name,
          preview: addedLine.trim().slice(0, 80),
        });
      }
    }
  }

  return findings;
}

function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log("check-secrets: no staged files");
    return;
  }

  const forbiddenFiles = stagedFiles.filter(
    (file) => !isAllowlisted(file) && isForbiddenFilename(file),
  );

  if (forbiddenFiles.length > 0) {
    console.error("check-secrets: forbidden secret-bearing files staged:");
    for (const file of forbiddenFiles) {
      console.error(`  - ${file}`);
    }
    process.exit(1);
  }

  const diff = getStagedDiff();
  const findings = scanDiff(diff);

  if (findings.length > 0) {
    console.error(
      "check-secrets: possible secrets detected in staged changes:",
    );
    for (const finding of findings) {
      console.error(
        `  - ${finding.file}: ${finding.kind} — "${finding.preview}"`,
      );
    }
    console.error(
      "\nIf this is a false positive, adjust scripts/check-secrets.mjs allowlist.",
    );
    process.exit(1);
  }

  console.log(
    `check-secrets: scanned ${stagedFiles.length} staged file(s) — OK`,
  );
}

main();
