import { AiPromptInput } from "@buek/ui";
import { useEffect, useRef } from "react";
import type { ChatMessage, DemoUser, Workspace } from "../types.js";
import { ChatMessageBlock } from "./ChatMessageBlock.js";
import { ContinueWorking } from "./ContinueWorking.js";
import { TodaySummary } from "./TodaySummary.js";

interface AiWorkspaceViewProps {
  user: DemoUser;
  workspace: Workspace;
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (trimmedInput: string) => Promise<void>;
  onContinueItem: (prompt: string) => void;
}

export function AiWorkspaceView({
  user,
  workspace,
  messages,
  input,
  isStreaming,
  onInputChange,
  onSubmit,
  onContinueItem
}: AiWorkspaceViewProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const hasUserMessages = messages.some((message) => message.role === "user");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSubmit() {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;
    onInputChange("");
    await onSubmit(trimmedInput);
  }

  const promptInput = (
    <AiPromptInput
      value={input}
      onChange={onInputChange}
      onSubmit={handleSubmit}
      disabled={isStreaming}
      placeholder="Apa yang bisa saya bantu hari ini?"
    />
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col">
      <header className="shrink-0 space-y-1 pb-6">
        <p className="text-sm text-slate-400">Good morning, {user.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{workspace.organization}</h1>
      </header>

      {!hasUserMessages ? (
        <div className="shrink-0 space-y-8">
          <div className="space-y-4 border-y border-white/10 py-6">
            <p className="text-sm text-slate-400">Apa yang bisa saya bantu hari ini?</p>
            {promptInput}
          </div>

          <TodaySummary workspace={workspace} />
          <ContinueWorking workspace={workspace} onSelect={onContinueItem} />
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 overflow-y-auto pb-4">
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
                  isStreaming={
                    isStreaming && index === messages.length - 1 && message.role === "assistant"
                  }
                />
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="shrink-0 border-t border-white/10 pt-4">{promptInput}</div>
        </>
      )}
    </div>
  );
}
