/**
 * Privacy-first error redaction shared by browser telemetry and server logs.
 *
 * Diagnostic text must never become a second storage path for investor contact
 * details, authentication material or URL query parameters.
 */
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /\+?\d[\d\s().-]{7,}\d/g;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const SUPABASE_KEY = /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/g;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*\b/gi;
const NAMED_SECRET = /\b(?:api[_-]?key|service[_-]?role[_-]?key|secret|token|authorization)\s*[:=]\s*[^\s,;]+/gi;
const URL_WITH_PRIVATE_PARTS = /https?:\/\/[^\s?#]+(?:\?[^\s#]*)?(?:#[^\s]*)?/gi;

export function redactDiagnosticText(value: string, maxLength = 8_000): string {
  if (!Number.isSafeInteger(maxLength) || maxLength < 1) {
    throw new Error("Invalid diagnostic length limit");
  }

  return value
    .replace(JWT, "[redacted-token]")
    .replace(SUPABASE_KEY, "[redacted-key]")
    .replace(BEARER, "Bearer [redacted-token]")
    .replace(NAMED_SECRET, (match) => {
      const separator = match.includes(":") ? ":" : "=";
      const name = match.split(/[:=]/, 1)[0]?.trim() || "secret";
      return name + separator + "[redacted]";
    })
    .replace(EMAIL, "[redacted-email]")
    .replace(PHONE, "[redacted-phone]")
    .replace(URL_WITH_PRIVATE_PARTS, (match) => {
      try {
        const parsed = new URL(match);
        return parsed.origin + parsed.pathname;
      } catch {
        return "[redacted-url]";
      }
    })
    .slice(0, maxLength);
}

function errorStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? " (status " + value + ")" : "";
}

function safeStackFrames(error: Error, maxLength: number): string {
  if (!error.stack) return "";
  // The first stack line normally repeats error.message, which may contain
  // visitor/contact text. Keep frames only.
  return redactDiagnosticText(error.stack.split("\n").slice(1, 13).join("\n"), maxLength);
}

export function describeDiagnosticError(
  error: unknown,
  maxLength = 8_000,
  causeDepthLimit = 5,
): string {
  if (!Number.isSafeInteger(maxLength) || maxLength < 1 ||
      !Number.isSafeInteger(causeDepthLimit) || causeDepthLimit < 1) {
    throw new Error("Invalid diagnostic limits");
  }

  const parts: string[] = [];
  let current: unknown = error;

  for (let depth = 0; depth < causeDepthLimit && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(depth === 0
        ? "Non-Error failure (" + typeof current + ")"
        : "caused by: non-Error (" + typeof current + ")");
      break;
    }

    const label = depth === 0 ? "" : "caused by: ";
    const name = redactDiagnosticText(current.name || "Error", 120);
    const frames = safeStackFrames(current, maxLength);
    parts.push(label + name + errorStatus(current) + (frames ? "\n" + frames : ""));
    current = current.cause;
  }

  return parts.join("\n").slice(0, maxLength);
}

export function safeTelemetryError(error: unknown): Error {
  if (typeof Response !== "undefined" && error instanceof Response) {
    return new Error("Response " + error.status);
  }

  if (error instanceof Error) {
    const name = redactDiagnosticText(error.name || "Error", 120);
    return new Error(name + errorStatus(error) + " (message redacted)");
  }

  return new Error("Non-Error failure (" + typeof error + ")");
}
