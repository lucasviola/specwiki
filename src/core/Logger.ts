type LogPayload = Record<string, unknown>;

let verbose = false;

function serializeLogLine(
  level: "info" | "warn" | "error",
  event: string,
  payload: LogPayload,
): string {
  const record = { ...payload, event, level };
  try {
    return JSON.stringify(record) + "\n";
  } catch {
    return (
      JSON.stringify({
        event,
        level,
        serializationError: true,
        message: "log payload could not be serialized",
      }) + "\n"
    );
  }
}

function writeLog(
  level: "info" | "warn" | "error",
  event: string,
  payload: LogPayload,
): void {
  process.stderr.write(serializeLogLine(level, event, payload));
}

export const log = {
  setVerbose(enabled: boolean): void {
    verbose = enabled;
  },

  info(event: string, payload: LogPayload = {}): void {
    if (!verbose) {
      return;
    }
    writeLog("info", event, payload);
  },

  warn(event: string, payload: LogPayload = {}): void {
    writeLog("warn", event, payload);
  },

  error(event: string, payload: LogPayload = {}): void {
    writeLog("error", event, payload);
  },
};
