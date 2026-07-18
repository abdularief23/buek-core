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
    <article className={message.role === "user" ? "ml-8 text-right" : ""}>
      <div
        className={
          message.role === "user"
            ? "inline-block rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-slate-200"
            : "text-sm leading-7 text-slate-300"
        }
      >
        {message.content || (message.role === "assistant" && isStreaming ? "..." : "")}

        {message.role === "assistant" && !isStreaming ? (
          <AiContextPanels panels={contextPanels} workspace={workspace} />
        ) : null}
      </div>
    </article>
  );
}
