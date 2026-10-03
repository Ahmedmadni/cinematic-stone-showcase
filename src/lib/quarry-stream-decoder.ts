/**
 * Streaming Server-Sent Events decoder for the PUBLIC, quarry-only assistant.
 *
 * HTTP chunks are arbitrary byte boundaries: one JSON SSE payload may arrive
 * over many chunks and one chunk can contain several events. Dispatch only
 * after the blank line that terminates an SSE event, not at each data line.
 * This file is browser-agnostic so Node tests do not need model credentials.
 */
export type QuarryStreamEvent =
  | { kind: "text"; text: string }
  | { kind: "complete" }
  | { kind: "error" };

const MAX_PENDING_CHARS = 32_768;
const MAX_RESPONSE_CHARS = 24_000;

export function createQuarryStreamDecoder() {
  let pending = "";
  let dataLines: string[] = [];
  let completed = false;
  let eventCharacters = 0;
  let responseCharacters = 0;

  function emit(): QuarryStreamEvent[] {
    if (dataLines.length === 0 || completed) {
      dataLines = [];
      eventCharacters = 0;
      return [];
    }
    const raw = dataLines.join("\n");
    dataLines = [];
    eventCharacters = 0;
    if (raw === "[DONE]") {
      completed = true;
      return [{ kind: "complete" }];
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(raw);
    } catch {
      throw new Error("Malformed assistant stream response");
    }
    if (decoded === null || typeof decoded !== "object" || !("type" in decoded)) {
      return [];
    }
    const event = decoded as { type?: unknown; delta?: unknown };
    if (event.type === "response.failed" || event.type === "error") {
      completed = true;
      return [{ kind: "error" }];
    }
    if (event.type === "response.completed") {
      completed = true;
      return [{ kind: "complete" }];
    }
    if (event.type !== "response.output_text.delta" || typeof event.delta !== "string") {
      return [];
    }
    responseCharacters += event.delta.length;
    if (responseCharacters > MAX_RESPONSE_CHARS) {
      throw new Error("Assistant response exceeded display limit");
    }
    return [{ kind: "text", text: event.delta }];
  }

  function acceptLine(line: string): QuarryStreamEvent[] {
    if (completed) return [];
    // Empty line ends one SSE event. CRLF is allowed even when chunks split
    // immediately between the carriage return and the line feed.
    if (line === "") return emit();
    if (line.startsWith(":")) return []; // keepalive comment
    if (!line.startsWith("data:")) return []; // id, event, retry
    const data = line.slice(5).replace(/^ /, "");
    eventCharacters += data.length;
    if (eventCharacters > MAX_PENDING_CHARS) {
      throw new Error("Oversized assistant stream event");
    }
    dataLines.push(data);
    return [];
  }

  function push(chunk: string): QuarryStreamEvent[] {
    if (completed) return [];
    pending += chunk;
    const emitted: QuarryStreamEvent[] = [];
    let newLine: number;
    while ((newLine = pending.indexOf("\n")) !== -1) {
      const rawLine = pending.slice(0, newLine);
      pending = pending.slice(newLine + 1);
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
      emitted.push(...acceptLine(line));
      if (completed) {
        pending = "";
        dataLines = [];
        return emitted;
      }
    }
    if (pending.length + eventCharacters > MAX_PENDING_CHARS) {
      throw new Error("Oversized assistant stream event");
    }
    return emitted;
  }

  function finish(): QuarryStreamEvent[] {
    if (completed) return [];
    // Some providers close after response.completed rather than [DONE];
    // both are recognized above. Otherwise an EOF is not an answer.
    throw new Error("Assistant stream ended before completion");
  }

  return { push, finish };
}
