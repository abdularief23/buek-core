import { AiPromptInput } from "@buek/ui";
import { useEffect, useRef } from "react";
import type { ChatMessage, Workspace } from "../types.js";
import { ChatMessageBlock } from "./ChatMessageBlock.js";

interface AskBuekViewProps {
  workspace: Workspace;
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (trimmedInput: string) => Promise<void>;
}

export function AskBuekView({
  workspace,
  messages,
  input,
  isStreaming,
  onInputChange,
  onSubmit
}: AskBuekViewProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSubmit() {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;
    onInputChange("");
    await onSubmit(trimmedInput);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col">
      <header className="shrink-0 pb-4">
        <h1 className="text-xl font-semibold text-white">Ask Buek</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ask about production, maintenance, quality, documents, and more.
        </p>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Start a conversation — try asking about a machine alarm, OEE drop, or SOP.
          </p>
        ) : (
          messages.map((message, index) => {
            const previousUserMessage = [...messages]
              .slice(0, index)
              .reverse()
              .find((candidate) => candidate.role === "user")?.content;

            return (
              <ChatMessageBlock
                key={message.id}
                message={message}
                workspace={workspace}
                previousUserMessage={previousUserMessage}
                isStreaming={
                  isStreaming && index === messages.length - 1 && message.role === "assistant"
                }
              />
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-white/10 pt-4">
        <AiPromptInput
          value={input}
          onChange={onInputChange}
          onSubmit={handleSubmit}
          disabled={isStreaming}
          placeholder="Ask Buek anything..."
        />
      </div>
    </div>
  );
}
