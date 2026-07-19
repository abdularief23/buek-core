import { AiPromptInput } from "@buek/ui";
import { useEffect, useRef, useState } from "react";
import type { DynamicWorkspaceState } from "./DynamicWorkspace.js";
import { buildProactiveBriefing } from "../lib/proactive-briefing.js";
import { copilotModesForRole } from "../lib/roles.js";
import type { ChatMessage, DemoUser, RoleHomeData, Workspace } from "../types.js";
import { ChatMessageBlock } from "./ChatMessageBlock.js";

export type AiAssistantMode = "summarize" | "analyze" | "search" | "draft" | null;

interface AiCopilotProps {
  user: DemoUser;
  workspace: Workspace;
  roleHome: RoleHomeData;
  open: boolean;
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  mode: AiAssistantMode;
  onToggle: () => void;
  onModeChange: (mode: AiAssistantMode) => void;
  onInputChange: (value: string) => void;
  onSubmit: (trimmedInput: string) => Promise<void>;
  onOpenWorkspace?: (workspace: DynamicWorkspaceState) => void;
  onExplain: (prompt: string, contextLabel: string) => void;
}

const modes: Array<{
  id: Exclude<AiAssistantMode, null>;
  icon: string;
  label: string;
  description: string;
}> = [
  { id: "summarize", icon: "✨", label: "Ringkas", description: "Ringkasan data dari sistem" },
  { id: "analyze", icon: "✨", label: "Analisis", description: "Analisis root cause & rekomendasi" },
  { id: "search", icon: "✨", label: "Cari", description: "Cari SOP, histori, kasus serupa" },
  { id: "draft", icon: "✨", label: "Buat Draft", description: "Susun draft laporan investigasi" }
];

export function AiCopilot({
  user,
  workspace,
  roleHome,
  open,
  messages,
  input,
  isStreaming,
  mode,
  onToggle,
  onModeChange,
  onInputChange,
  onSubmit,
  onOpenWorkspace,
  onExplain
}: AiCopilotProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const briefing = buildProactiveBriefing(user.name, workspace, roleHome);
  const showChat = mode !== null || messages.length > 0;
  const visibleModes = modes.filter((item) => copilotModesForRole(user.role).includes(item.id));

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

  function handleModeSelect(next: Exclude<AiAssistantMode, null>) {
    onModeChange(next);
    const prompts: Record<Exclude<AiAssistantMode, null>, string> = {
      summarize: "Ringkas status operasional hari ini berdasarkan data sistem",
      analyze: "Analisis isu prioritas hari ini dan berikan rekomendasi",
      search: "Cari SOP dan kasus serupa yang relevan",
      draft: "Buat draft laporan investigasi untuk isu prioritas"
    };
    onExplain(prompts[next], modes.find((m) => m.id === next)?.label ?? "AI");
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
              <p className="text-lg font-semibold text-white">Hai {user.name} 👋</p>
              <p className="mt-1 buek-subtitle text-slate-500">AI Assistant</p>
            </header>

            {messages.length === 0 ? (
              <div className="border-b border-white/10 px-6 py-5">
                <p className="buek-body text-slate-300">{briefing.greeting}</p>
                {briefing.items.length ? (
                  <ul className="mt-4 space-y-3">
                    {briefing.items.map((item, idx) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
                      >
                        <span className="buek-small text-slate-400">{idx + 1}.</span>
                        <span className="flex-1 buek-body text-slate-200">{item.text}</span>
                        <button
                          type="button"
                        onClick={() => {
                          if (item.workspace && onOpenWorkspace) {
                            onOpenWorkspace(item.workspace);
                            onToggle();
                          }
                        }}
                          className="shrink-0 rounded-lg bg-cyan-500/20 px-3 py-1.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30"
                        >
                          {item.actionLabel} ↓
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {!showChat ? (
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-sm text-slate-500">Apa yang ingin Anda lakukan?</p>
                <div className="mt-4 grid gap-2">
                  {visibleModes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleModeSelect(item.id)}
                      className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-left hover:border-cyan-400/30 hover:bg-white/[0.03]"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {showChat ? (
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
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
                        isStreaming &&
                        index === messages.length - 1 &&
                        message.role === "assistant"
                      }
                    />
                  );
                })}
                <div ref={endRef} />
              </div>
            ) : null}

            {showChat ? (
              <div className="border-t border-white/10 p-5">
                <AiPromptInput
                  value={input}
                  onChange={onInputChange}
                  onSubmit={handleSubmit}
                  disabled={isStreaming}
                  placeholder={
                    mode === "search"
                      ? "Cari informasi..."
                      : mode === "summarize"
                        ? "Data apa yang ingin diringkas?"
                        : "Jelaskan masalah atau tanyakan analisis..."
                  }
                  id="copilot-prompt"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-1">
          {!open ? (
            <span className="rounded-full bg-slate-800 px-3 py-1.5 text-sm text-slate-400 shadow">
              AI Assistant
            </span>
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? "Tutup AI Assistant" : "Buka AI Assistant"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
          >
            {open ? "✕" : "✨"}
          </button>
        </div>
      </div>
    </>
  );
}
