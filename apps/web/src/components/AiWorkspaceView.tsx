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

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-2xl flex-col">
      <header className="shrink-0 pb-4">
        <p className="text-sm text-slate-500">Good morning, {user.name}</p>
        <h1 className="text-xl font-medium text-slate-100">{workspace.organization}</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {!hasUserMessages ? (
          <p className="text-sm text-slate-500">Apa yang bisa saya bantu hari ini?</p>
        ) : null}

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

        {!hasUserMessages ? (
          <>
            <TodaySummary workspace={workspace} />
            <ContinueWorking workspace={workspace} onSelect={onContinueItem} />
          </>
        ) : null}

        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-white/5 pt-4">
        <AiPromptInput
          value={input}
          onChange={onInputChange}
          onSubmit={handleSubmit}
          disabled={isStreaming}
          placeholder="Tanyakan apa saja — produksi, maintenance, quality, KPI..."
        />
      </div>
    </div>
  );
}
