import { safeTelemetryError } from "./error-redaction";

type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  track?: (event: string, properties?: Record<string, unknown>) => string | null;
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __lovableReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const safeError = safeTelemetryError(error);
  const safeRoute = window.location.pathname === "/" ? "/" : "[redacted-route]";
  const safeBoundary = typeof context["boundary"] === "string"
    ? context["boundary"].slice(0, 120)
    : undefined;

  window.__lovableEvents?.captureException?.(
    safeError,
    {
      source: "react_error_boundary",
      route: safeRoute,
      ...(safeBoundary ? { boundary: safeBoundary } : {}),
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );

  // Prod React does not rethrow boundary-caught errors to window.onerror.
  // Forward only a sanitized type/status to the editor hook — never the raw
  // message, stack, URL query or arbitrary cause object.
  window.__lovableReportRuntimeError?.({
    message: safeError.message,
    filename: safeRoute,
  });
}
