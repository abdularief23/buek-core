import { AiPromptInput } from "@buek/ui";
import { useEffect, useRef } from "react";
import type { AiContext } from "../lib/context.js";
import type { ChatMessage, DemoUser, Workspace } from "../types.js";
import { ChatMessageBlock } from "./ChatMessageBlock.js";

interface AiCopilotProps {
  user: DemoUser;
  workspace: Workspace;
  context: AiContext;
  open: boolean;
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  onToggle: () => void;
  onInputChange: (value: string) => void;
  onSubmit: (trimmedInput: string) => Promise<void>;
  onSuggestion: (prompt: string) => void;
}

export function AiCopilot({
  user,
  workspace,
  context,
  open,
  messages,
  input,
  isStreaming,
  onToggle,
  onInputChange,
  onSubmit,
  onSuggestion
}: AiCopilotProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const suggestions = workspace.dailyWorkspace.copilotSuggestions;

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, open]);

  async function handleSubmit() {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;
    onInputChange("");
    await onSubmit(trimmedInput);
  }

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onToggle}
          aria-hidden="true"
        />
      ) : null}

      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 lg:bottom-8 lg:right-8">
        {open ? (
          <div className="flex max-h-[min(80vh,640px)] w-[min(100vw-2rem,28rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <header className="border-b border-white/10 px-5 py-4">
              <p className="text-base font-medium text-white">Hi {user.name} 👋</p>
              <p className="mt-0.5 text-sm text-slate-500">How can I help today?</p>

              <div className="mt-3 rounded-xl bg-white/5 px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Current Context
                </p>
                <p className="mt-1 text-sm font-medium text-cyan-200">{context.label}</p>
                {context.details?.map((detail) => (
                  <p key={detail} className="text-xs text-slate-500">
                    {detail}
                  </p>
                ))}
                {user.role ? <p className="text-xs text-slate-500">{user.role}</p> : null}
                {workspace.shift ? (
                  <p className="text-xs text-slate-500">{workspace.shift}</p>
                ) : null}
              </div>
            </header>

            {suggestions.length > 0 && messages.length === 0 ? (
              <div className="border-b border-white/10 px-5 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Suggested
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => onSuggestion(suggestion.prompt)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:text-white"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500">Ask anything about your factory...</p>
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
                        isStreaming &&
                        index === messages.length - 1 &&
                        message.role === "assistant"
                      }
                    />
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-white/10 p-4">
              <AiPromptInput
                value={input}
                onChange={onInputChange}
                onSubmit={handleSubmit}
                disabled={isStreaming}
                placeholder="Ask anything..."
                id="copilot-prompt"
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-1">
          {!open ? (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400 shadow">
              Ask Buek
            </span>
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? "Close Ask Buek" : "Open Ask Buek"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
          >
            {open ? "✕" : "B"}
          </button>
        </div>
      </div>
    </>
  );
}
