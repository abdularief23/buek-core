import { AiPromptInput } from "@buek/ui";
import { useEffect, useRef, useState } from "react";
import type { DynamicWorkspaceState } from "./DynamicWorkspace.js";
import { buildProactiveBriefing } from "../lib/proactive-briefing.js";
import type { ChatMessage, DemoUser, RoleHomeData, Workspace } from "../types.js";
import { ChatMessageBlock } from "./ChatMessageBlock.js";

export type AiAssistantMode = "search" | "summarize" | "analyze" | "action" | null;

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
  { id: "search", icon: "🔍", label: "Cari informasi", description: "Cari SOP, data, atau kasus" },
  { id: "summarize", icon: "📄", label: "Ringkas data", description: "Ringkasan singkat untuk keputusan" },
  { id: "analyze", icon: "🧠", label: "Analisis masalah", description: "Root cause & rekomendasi" },
  { id: "action", icon: "⚡", label: "Lakukan tindakan", description: "Buat WO, assign, approve" }
];

const actionOptions = [
  { label: "Lihat histori", prompt: "Tampilkan histori masalah serupa" },
  { label: "Cari kasus serupa", prompt: "Cari kasus serupa dari knowledge base" },
  { label: "Buat work order", prompt: "Buat work order untuk perbaikan mesin" },
  { label: "Hubungi engineer", prompt: "Assign engineer untuk investigasi" }
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
  const showChat = mode === "analyze" || mode === "search" || mode === "summarize" || messages.length > 0;

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
    if (next === "summarize") {
      onExplain("Ringkas status pabrik hari ini untuk saya", "Ringkasan");
    }
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
                            } else if (item.explainPrompt) {
                              onModeChange("analyze");
                              onExplain(item.explainPrompt, item.text);
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
                  {modes.map((item) => (
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

            {mode === "action" && messages.length === 0 ? (
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-sm text-slate-500">Yang ingin Anda lakukan?</p>
                <div className="mt-3 space-y-2">
                  {actionOptions.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => onExplain(option.prompt, option.label)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-slate-300 hover:border-cyan-400/30"
                    >
                      <span className="text-cyan-400">○</span>
                      {option.label}
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
