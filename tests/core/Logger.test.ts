import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "../../src/core/Logger.js";

describe("Logger", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    log.setVerbose(false);
    stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    log.setVerbose(false);
  });

  it("suppresses log.info when verbose is disabled", () => {
    log.info("discover.start", { projectRoot: "/tmp", patternCount: 3 });

    expect(stderrSpy).not.toHaveBeenCalled();
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it("emits log.info to stderr when verbose is enabled", () => {
    log.setVerbose(true);
    log.info("discover.start", { projectRoot: "/tmp", patternCount: 3 });

    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stdoutSpy).not.toHaveBeenCalled();

    const line = String(stderrSpy.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as Record<string, unknown>;

    expect(parsed).toEqual({
      event: "discover.start",
      level: "info",
      projectRoot: "/tmp",
      patternCount: 3,
    });
  });

  it("always emits log.error regardless of verbose flag", () => {
    log.error("parse.error", { path: "SPEC.md", message: "read failed" });

    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stdoutSpy).not.toHaveBeenCalled();

    const line = String(stderrSpy.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as Record<string, unknown>;

    expect(parsed).toEqual({
      event: "parse.error",
      level: "error",
      path: "SPEC.md",
      message: "read failed",
    });
  });

  it("emits log.error when verbose is enabled", () => {
    log.setVerbose(true);
    log.error("cli.error", { reason: "invalid path" });

    expect(stderrSpy).toHaveBeenCalledOnce();

    const line = String(stderrSpy.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as Record<string, unknown>;

    expect(parsed.event).toBe("cli.error");
    expect(parsed.level).toBe("error");
    expect(parsed.reason).toBe("invalid path");
  });

  it("uses dot-separated event names", () => {
    log.setVerbose(true);
    log.info("output.write", { targetPath: "wiki/index.md" });

    const line = String(stderrSpy.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as Record<string, unknown>;

    expect(parsed.event).toBe("output.write");
    expect(String(parsed.event)).toMatch(/^[a-z]+(\.[a-z]+)+$/);
  });

  it("serializes JSON-serializable payloads", () => {
    log.setVerbose(true);
    log.info("discover.match", {
      relativePath: ".cursor/rules/foo.mdc",
      count: 1,
      nested: { ok: true },
    });

    const line = String(stderrSpy.mock.calls[0]?.[0]);
    expect(() => JSON.parse(line)).not.toThrow();
  });

  it("writes newline-terminated JSON lines to stderr", () => {
    log.setVerbose(true);
    log.info("cli.command", { command: "generate" });

    const line = String(stderrSpy.mock.calls[0]?.[0]);
    expect(line.endsWith("\n")).toBe(true);
  });

  it("preserves canonical event and level when payload includes those keys", () => {
    log.error("parse.error", {
      event: "spoofed.event",
      level: "info",
      path: "SPEC.md",
    });

    const line = String(stderrSpy.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as Record<string, unknown>;

    expect(parsed.event).toBe("parse.error");
    expect(parsed.level).toBe("error");
    expect(parsed.path).toBe("SPEC.md");
  });

  it("emits a fallback line for non-serializable payloads without throwing", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => log.error("parse.error", circular)).not.toThrow();

    const line = String(stderrSpy.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as Record<string, unknown>;

    expect(parsed).toEqual({
      event: "parse.error",
      level: "error",
      serializationError: true,
      message: "log payload could not be serialized",
    });
  });
});
