import type { ChatMetadata } from "../types.js";

export interface StreamEvent {
  event: string;
  data: unknown;
}

export function createMessageId() {
  return crypto.randomUUID();
}

export function parseServerSentEvents(buffer: string): { events: StreamEvent[]; remaining: string } {
  const chunks = buffer.split("\n\n");
  const remaining = chunks.pop() ?? "";
  const events = chunks
    .map((chunk) => {
      const eventLine = chunk
        .split("\n")
        .find((line) => line.startsWith("event:"))
        ?.replace("event:", "")
        .trim();
      const dataLine = chunk
        .split("\n")
        .find((line) => line.startsWith("data:"))
        ?.replace("data:", "")
        .trim();

      if (!eventLine || !dataLine) {
        return undefined;
      }

      return { event: eventLine, data: JSON.parse(dataLine) as unknown };
    })
    .filter((event): event is StreamEvent => Boolean(event));

  return { events, remaining };
}

export function hasTextDelta(data: unknown): data is { text: string } {
  return Boolean(
    data && typeof data === "object" && typeof (data as { text?: unknown }).text === "string"
  );
}

export function hasErrorMessage(data: unknown): data is { message: string } {
  return Boolean(
    data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
  );
}

export function isChatMetadata(data: unknown): data is ChatMetadata {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<ChatMetadata>;
  return Boolean(candidate.detectedModule && Array.isArray(candidate.references));
}

export function areaStatusIcon(status: "green" | "yellow" | "red") {
  if (status === "green") return "🟢";
  if (status === "yellow") return "🟡";
  return "🔴";
}

export function healthIcon(status: "healthy" | "attention" | "critical") {
  if (status === "healthy") return "🟢";
  if (status === "attention") return "🟡";
  return "🔴";
}
