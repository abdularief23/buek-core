import { AiPromptInput } from "@buek/ui";
import { useEffect, useRef } from "react";
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
  { id: "analyze", icon: "✨", label: "Analisis", description: "Ranked possible causes & rekomendasi" },
  { id: "search", icon: "✨", label: "Cari", description: "Cari SOP, histori, kasus serupa" },
  { id: "draft", icon: "✨", label: "Buat Draft", description: "Susun draft laporan investigasi" }
];

function CopilotPanel({
  user,
  workspace,
  roleHome,
  messages,
  input,
  isStreaming,
  mode,
  showChat,
  visibleModes,
  onToggle,
  onModeChange,
  onInputChange,
  onSubmit,
  onOpenWorkspace,
  onExplain,
  fullscreen
}: AiCopilotProps & {
  showChat: boolean;
  visibleModes: typeof modes;
  fullscreen?: boolean;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const briefing = buildProactiveBriefing(user.name, workspace, roleHome);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

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
    <div
      className={`ai-copilot-panel flex flex-col overflow-hidden bg-slate-900 ${
        fullscreen
          ? "fixed inset-0 z-[60] h-full w-full rounded-none border-0"
          : "max-h-[min(88vh,780px)] w-[min(100vw-1.5rem,42rem)] rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
      }`}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="mobile-title text-lg font-semibold text-white">AI Assistant</p>
          <p className="mobile-body text-sm text-slate-500">Hai {user.name} 👋</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white"
          aria-label="Tutup AI Assistant"
        >
          ✕
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="shrink-0 border-b border-white/10 px-5 py-4">
            <p className="mobile-body text-slate-300">{briefing.greeting}</p>
            {briefing.items.length ? (
              <ul className="mt-4 space-y-3">
                {briefing.items.map((item, idx) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
                  >
                    <span className="mobile-small text-slate-400">{idx + 1}.</span>
                    <span className="mobile-body flex-1 text-slate-200">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.workspace && onOpenWorkspace) {
                          onOpenWorkspace(item.workspace);
                          onToggle();
                        }
                      }}
                      className="shrink-0 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-300"
                    >
                      {item.actionLabel}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {!showChat ? (
          <div className="shrink-0 border-b border-white/10 px-5 py-4">
            <p className="mobile-body text-slate-500">Apa yang bisa saya bantu?</p>
            <div className="mt-4 grid gap-2">
              {visibleModes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleModeSelect(item.id)}
                  className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-4 text-left active:bg-white/[0.03]"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="mobile-body font-medium text-white">{item.label}</p>
                    <p className="mobile-small text-slate-500">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {showChat ? (
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
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
        ) : null}

        {showChat ? (
          <div className="shrink-0 border-t border-white/10 p-4">
            <AiPromptInput
              value={input}
              onChange={onInputChange}
              onSubmit={() => void handleSubmit()}
              disabled={isStreaming}
              placeholder="Jelaskan masalah atau tanyakan analisis..."
              id="copilot-prompt"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AiCopilot(props: AiCopilotProps) {
  const { open, onToggle, user, mode, messages } = props;
  const showChat = mode !== null || messages.length > 0;
  const visibleModes = modes.filter((item) => copilotModesForRole(user.role).includes(item.id));

  return (
    <>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:bg-transparent lg:backdrop-blur-none"
            onClick={onToggle}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[60] lg:hidden">
            <CopilotPanel {...props} showChat={showChat} visibleModes={visibleModes} />
          </div>
          <div className="pointer-events-none fixed bottom-8 right-8 z-50 hidden lg:block">
            <div className="pointer-events-auto">
              <CopilotPanel {...props} showChat={showChat} visibleModes={visibleModes} />
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Buka AI Assistant"
          className="ai-copilot-fab fixed bottom-[5.5rem] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-lg shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 lg:bottom-8 lg:h-14 lg:w-14"
        >
          ✨
        </button>
      )}
    </>
  );
}
