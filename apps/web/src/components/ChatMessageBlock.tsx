import { ExpandableSection } from "@buek/ui";
import type { ChatMessage } from "../types.js";

interface ChatMessageBlockProps {
  message: ChatMessage;
  isStreaming: boolean;
}

export function ChatMessageBlock({ message, isStreaming }: ChatMessageBlockProps) {
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

        {message.metadata?.references.length ? (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            {message.metadata.references.map((reference) => (
              <ExpandableSection
                key={reference.id}
                title={reference.referenceId ?? reference.id}
                subtitle={reference.title}
              >
                {reference.excerpt ? (
                  <p className="text-sm leading-6 text-slate-400">{reference.excerpt}</p>
                ) : (
                  <p className="text-sm text-slate-500">Reference retrieved from workspace knowledge.</p>
                )}
                {typeof reference.score === "number" ? (
                  <p className="mt-2 text-xs text-slate-500">Relevance score: {reference.score}</p>
                ) : null}
              </ExpandableSection>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
