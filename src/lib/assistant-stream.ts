/**
 * Browser-safe, privacy-preserving parser for the quarry assistant's
 * text/event-stream protocol. Never evaluate provider text as instructions or
 * HTML; callers append delta text as ordinary React content.
 *
 * Handles UTF-8-decoded chunks that split lines, CRLF line endings, comments,
 * multiline SSE data and explicit gateway failures. Provider error bodies
 * are intentionally not exposed to visitors.
 */
export type AssistantStreamEvent =
  | { kind: "delta"; text: string }
  | { kind: "done" }
  | { kind: "error" };

const MAX_EVENT_CHARS = 131_072;

export function createAssistantStreamParser() {
  let partialLine = "";
  let dataLines: string[] = [];
  let namedEvent = "";
  let completed = false;
  let stopped = false;

  function dispatch(): AssistantStreamEvent[] {
    if (dataLines.length === 0 && !namedEvent) return [];
    const data = dataLines.join("\n");
    const eventName = namedEvent;
    dataLines = [];
    namedEvent = "";

    if (completed || stopped) return [];
    if (data.trim() === "[DONE]") {
      completed = true;
      return [{ kind: "done" }];
    }

    let parsed: unknown;
    if (data.trim()) {
      try {
        parsed = JSON.parse(data);
      } catch {
        // A malformed provider event must not be interpreted as visible text.
        // Continue reading; if nothing valid arrives finish() returns error.
        if (eventName === "error") {
          stopped = true;
          return [{ kind: "error" }];
        }
        return [];
      }
    }

    const item = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
    const type = typeof item?.["type"] === "string" ? item["type"] : eventName;

    if (type === "response.failed" || type === "error" ||
        type === "response.incomplete" || eventName === "error") {
      stopped = true;
      return [{ kind: "error" }];
    }
    if (type === "response.completed") {
      completed = true;
      return [{ kind: "done" }];
    }
    if (type === "response.output_text.delta" && typeof item?.["delta"] === "string") {
      return item["delta"] ? [{ kind: "delta", text: item["delta"] }] : [];
    }
    return [];
  }

  function handleLine(raw: string): AssistantStreamEvent[] {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    if (line === "") return dispatch();
    if (line.startsWith(":")) return [];
    const separator = line.indexOf(":");
    const name = separator === -1 ? line : line.slice(0, separator);
    const rawValue = separator === -1 ? "" : line.slice(separator + 1);
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

    if (name === "data") dataLines.push(value);
    if (name === "event") namedEvent = value;
    return [];
  }

  function push(chunk: string): AssistantStreamEvent[] {
    if (stopped || completed) return [];
    partialLine += chunk;
    if (partialLine.length > MAX_EVENT_CHARS || dataLines.join("\n").length > MAX_EVENT_CHARS) {
      stopped = true;
      return [{ kind: "error" }];
    }
    const events: AssistantStreamEvent[] = [];
    let index: number;
    while ((index = partialLine.indexOf("\n")) >= 0) {
      const line = partialLine.slice(0, index);
      partialLine = partialLine.slice(index + 1);
      events.push(...handleLine(line));
      if (stopped || completed) break;
    }
    return events;
  }

  function finish(): AssistantStreamEvent[] {
    if (stopped) return [{ kind: "error" }];
    if (completed) return [];
    // The final SSE record is sometimes delivered without a trailing newline.
    const events: AssistantStreamEvent[] = [];
    if (partialLine) {
      events.push(...handleLine(partialLine));
      partialLine = "";
    }
    events.push(...dispatch());
    // A clean-looking network EOF without provider completion is NOT a
    // successful answer; otherwise truncated replies appear as fully verified.
    if (!completed && !stopped) return [...events, { kind: "error" }];
    return events;
  }

  return { push, finish };
}
