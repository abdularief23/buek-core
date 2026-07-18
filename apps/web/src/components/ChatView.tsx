import { AiPromptInput } from "@buek/ui";
import { useEffect, useRef } from "react";
import type { ChatMessage, Workspace } from "../types.js";
import { ChatMessageBlock } from "./ChatMessageBlock.js";

interface ChatViewProps {
  workspace: Workspace;
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (trimmedInput: string) => Promise<void>;
}

export function ChatView({
  workspace,
  messages,
  input,
  isStreaming,
  onInputChange,
  onSubmit
}: ChatViewProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-2xl flex-col">
      <header className="mb-4">
        <p className="text-xs text-slate-500">{workspace.organization}</p>
        <h2 className="text-lg font-medium text-slate-200">{workspace.aiWorker}</h2>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((message, index) => {
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
              isStreaming={isStreaming && index === messages.length - 1 && message.role === "assistant"}
            />
          );
        })}
        <div ref={endRef} />
      </div>

      <AiPromptInput
        value={input}
        onChange={onInputChange}
        onSubmit={() => {
          if (!input.trim() || isStreaming) return;
          void streamSubmit();
        }}
        disabled={isStreaming}
        placeholder="Ask anything — AI will find the right module and knowledge"
      />
    </div>
  );

  async function streamSubmit() {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;
    onInputChange("");
    await onSubmit(trimmedInput);
  }
}
