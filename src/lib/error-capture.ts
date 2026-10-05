import { redactDiagnosticText } from "./error-redaction";

// Captures only the Error object out-of-band so server.ts can recover a safe
// diagnostic shape when h3 has already swallowed the throw into a generic 500.
let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;
const CAUSE_DEPTH_LIMIT = 5;
const DESCRIPTION_LENGTH_LIMIT = 8_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

function safeStackFrames(error: Error): string {
  const stack = error.stack;
  if (!stack) return "";
  // The first stack line normally repeats error.message, which may contain
  // request/contact text. Keep frames only, then redact URLs/secrets/PII.
  return redactDiagnosticText(stack.split("\n").slice(1, 13).join("\n"), DESCRIPTION_LENGTH_LIMIT);
}

export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;

  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(depth === 0
        ? `Non-Error failure (${typeof current})`
        : `caused by: non-Error (${typeof current})`);
      break;
    }

    const label = depth === 0 ? "" : "caused by: ";
    const name = redactDiagnosticText(current.name || "Error", 120);
    const frames = safeStackFrames(current);
    parts.push(`${label}${name}${describeStatus(current)}${frames ? "\n" + frames : ""}`);
    current = current.cause;
  }

  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

// Wrap console.error so Error objects are recorded and serialized only through
// the privacy-safe diagnostic description. Non-Error arguments are left alone;
// application code must never log request/contact bodies as plain values.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const expanded = args.map((arg) => {
    if (!isErrorLike(arg)) return arg;
    record(arg);
    return describeError(arg);
  });
  originalConsoleError(...expanded);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
