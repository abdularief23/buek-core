import type { ChatMessage } from "../types.js";

interface ChatMessageBlockProps {
  message: ChatMessage;
  workspace: import("../types.js").Workspace;
  previousUserMessage?: string | undefined;
  isStreaming: boolean;
}

export function ChatMessageBlock({ message, isStreaming }: ChatMessageBlockProps) {
  return (
    <article className={message.role === "user" ? "ml-8 text-right" : ""}>
      <div
        className={
          message.role === "user"
            ? "inline-block rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-slate-100"
            : "rounded-2xl bg-slate-800/80 px-4 py-3 text-sm leading-7 text-slate-100 whitespace-pre-wrap"
        }
      >
        {message.content || (message.role === "assistant" && isStreaming ? "..." : "")}
      </div>
    </article>
  );
}
