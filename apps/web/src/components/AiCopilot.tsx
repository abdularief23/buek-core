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
  onSubmit
}: AiCopilotProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

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
          className="fixed inset-0 z-40 bg-black/40 lg:bg-transparent"
          onClick={onToggle}
          aria-hidden="true"
        />
      ) : null}

      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
        {open ? (
          <div className="flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <header className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-medium text-white">Hi {user.name} 👋</p>
              <p className="mt-0.5 text-xs text-slate-500">How can I help today?</p>
              {context.label !== "Daily Workspace" ? (
                <div className="mt-2 rounded-lg bg-cyan-400/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-cyan-400/80">
                    Current Context
                  </p>
                  <p className="text-xs text-cyan-100">{context.label}</p>
                </div>
              ) : null}
            </header>

            <div className="max-h-72 space-y-4 overflow-y-auto px-4 py-3">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Ask about {workspace.organization} — production, machines, quality, documents.
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

            <div className="border-t border-white/10 p-3">
              <AiPromptInput
                value={input}
                onChange={onInputChange}
                onSubmit={handleSubmit}
                disabled={isStreaming}
                placeholder="Ask Buek..."
                id="copilot-prompt"
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Close Ask Buek" : "Open Ask Buek"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
        >
          {open ? "✕" : "B"}
        </button>
      </div>
    </>
  );
}
