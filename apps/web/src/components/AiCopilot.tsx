import { AiPromptInput } from "@buek/ui";
import { useEffect, useRef } from "react";
import type { AiContext } from "../lib/context.js";
import type { ChatMessage, DemoUser, RoleHomeData, Workspace } from "../types.js";
import { ChatMessageBlock } from "./ChatMessageBlock.js";

interface AiCopilotProps {
  user: DemoUser;
  workspace: Workspace;
  roleHome: RoleHomeData;
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
  roleHome,
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
  const suggestions = roleHome.copilotSuggestions;

  const contextDetails = [
    user.role,
    ...((context.details ?? []).filter((detail) => detail !== user.role))
  ].filter(Boolean);

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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={onToggle}
          aria-hidden="true"
        />
      ) : null}

      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 lg:bottom-8 lg:right-8">
        {open ? (
          <div className="flex max-h-[min(88vh,780px)] w-[min(100vw-1.5rem,42rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">
            <header className="border-b border-white/10 px-6 py-5">
              <p className="text-lg font-semibold text-white">Hi {user.name} 👋</p>
              <p className="mt-1 buek-subtitle text-slate-500">{roleHome.personaLabel}</p>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Current Context
                </p>
                <p className="mt-2 text-base font-semibold text-cyan-200">{context.label}</p>
                {contextDetails.map((detail) => (
                  <p key={detail} className="buek-small text-slate-400">
                    {detail}
                  </p>
                ))}
                {workspace.shift ? (
                  <p className="buek-small text-slate-500">{workspace.shift}</p>
                ) : null}
              </div>
            </header>

            {suggestions.length > 0 && messages.length === 0 ? (
              <div className="border-b border-white/10 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Suggested
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => onSuggestion(suggestion.prompt)}
                      className="rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-white/[0.03] hover:text-white"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {messages.length === 0 ? (
                <p className="buek-body text-slate-500">
                  Ask Buek — answers adapt to your role as {user.role}.
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

            <div className="border-t border-white/10 p-5">
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

        <div className="flex flex-col items-center gap-1">
          {!open ? (
            <span className="rounded-full bg-slate-800 px-3 py-1.5 text-sm text-slate-400 shadow">
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
