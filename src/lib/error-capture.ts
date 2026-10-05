import { describeDiagnosticError } from "./error-redaction";

// Captures only the Error object out-of-band so server.ts can recover a safe
// diagnostic shape when h3 has already swallowed the throw into a generic 500.
let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;
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
    return describeDiagnosticError(arg);
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
