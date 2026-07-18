import type { ChatMessage, Workspace } from "../types.js";
import { deriveContextPanels } from "../lib/ai-actions.js";
import { AiContextPanels } from "./AiContextPanels.js";

interface ChatMessageBlockProps {
  message: ChatMessage;
  workspace: Workspace;
  previousUserMessage?: string | undefined;
  isStreaming: boolean;
}

export function ChatMessageBlock({
  message,
  workspace,
  previousUserMessage = "",
  isStreaming
}: ChatMessageBlockProps) {
  const contextPanels =
    message.role === "assistant" && message.content
      ? deriveContextPanels(workspace, message.content, previousUserMessage, message.metadata)
      : [];

  return (
    <article className={message.role === "user" ? "ml-auto max-w-xl" : "max-w-2xl"}>
      <div
        className={
          message.role === "user"
            ? "rounded-2xl bg-cyan-400/90 px-4 py-3 text-slate-950"
            : "rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-100"
        }
      >
        <div className="whitespace-pre-wrap text-sm leading-7">
          {message.content || (message.role === "assistant" && isStreaming ? "Thinking..." : "")}
        </div>

        {message.role === "assistant" && !isStreaming ? (
          <AiContextPanels panels={contextPanels} workspace={workspace} />
        ) : null}
      </div>
    </article>
  );
}
