import { Button } from "@buek/ui";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

interface ModuleSummary {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  prompts: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  tools: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

interface ModulesResponse {
  registry: {
    modules: ModuleSummary[];
  };
  discoveryErrors: Array<{
    moduleName: string;
    reason: string;
  }>;
}

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const modulesEndpoint = `${configuredApiUrl}/api/modules`;
const loginEndpoint = `${configuredApiUrl}/api/auth/demo-login`;
const chatEndpoint = `${configuredApiUrl}/api/chat`;

interface Workspace {
  id: string;
  companyId: string;
  name: string;
  organization: string;
  industry: string;
  domain: string;
  moduleId: string;
  description: string;
  plant: string;
  shift: string;
  knowledgeVersion: string;
  aiProvider: string;
  aiWorker: string;
  status: "knowledge-ready" | "no-knowledge";
  documentStats: Array<{
    label: string;
    count: number;
  }>;
  kpis: Array<{
    label: string;
    value: string;
    status: "green" | "yellow" | "red";
  }>;
  alerts: Array<{
    severity: "warning" | "critical" | "info";
    message: string;
  }>;
  aiInsights: string[];
  quickActions: string[];
  knowledgeCollections: string[];
  knowledgeSourceIds: string[];
}

interface DemoUser {
  id: string;
  companyId: string;
  username: string;
  name: string;
  role: string;
  workspaceId: string;
}

interface LoginResponse {
  user: DemoUser;
  workspace: Workspace;
}

interface ChatReference {
  id: string;
  title: string;
  referenceId?: string;
  score?: number;
  excerpt?: string;
}

interface ChatMetadata {
  workspace: {
    id: string;
    name: string;
    organization: string;
    industry: string;
    domain: string;
  };
  detectedModule: {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
  };
  references: ChatReference[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: ChatMetadata;
}

interface StreamEvent {
  event: string;
  data: unknown;
}

type ActiveView = "home" | "chat" | "workspace" | "settings";
type DetailPanel = "factory" | "production" | "maintenance" | "quality" | "kpi" | null;

function createMessageId() {
  return crypto.randomUUID();
}

function parseServerSentEvents(buffer: string): { events: StreamEvent[]; remaining: string } {
  const chunks = buffer.split("\n\n");
  const remaining = chunks.pop() ?? "";
  const events = chunks
    .map((chunk) => {
      const eventLine = chunk
        .split("\n")
        .find((line) => line.startsWith("event:"))
        ?.replace("event:", "")
        .trim();
      const dataLine = chunk
        .split("\n")
        .find((line) => line.startsWith("data:"))
        ?.replace("data:", "")
        .trim();

      if (!eventLine || !dataLine) {
        return undefined;
      }

      return {
        event: eventLine,
        data: JSON.parse(dataLine) as unknown
      };
    })
    .filter((event): event is StreamEvent => Boolean(event));

  return { events, remaining };
}

function hasTextDelta(data: unknown): data is { text: string } {
  return Boolean(
    data && typeof data === "object" && typeof (data as { text?: unknown }).text === "string"
  );
}

function hasErrorMessage(data: unknown): data is { message: string } {
  return Boolean(
    data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
  );
}

function isChatMetadata(data: unknown): data is ChatMetadata {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<ChatMetadata>;

  return Boolean(candidate.detectedModule && Array.isArray(candidate.references));
}

function kpiStatusColor(status: "green" | "yellow" | "red") {
  if (status === "green") return "text-emerald-300";
  if (status === "yellow") return "text-yellow-300";
  return "text-red-300";
}

function alertStyle(severity: "warning" | "critical" | "info") {
  if (severity === "critical") return "bg-red-400/10 text-red-200";
  if (severity === "warning") return "bg-yellow-400/10 text-yellow-200";
  return "bg-slate-400/10 text-slate-300";
}

function mapQuickActionToPanel(action: string): DetailPanel {
  const normalized = action.toLowerCase();
  if (normalized.includes("production")) return "production";
  if (normalized.includes("quality")) return "quality";
  if (normalized.includes("maintenance")) return "maintenance";
  if (normalized.includes("engineering") || normalized.includes("inventory")) return "factory";
  return null;
}

export function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [companyId, setCompanyId] = useState("Epson Demo");
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo123");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [expandedPanel, setExpandedPanel] = useState<DetailPanel>(null);
  const [status, setStatus] = useState("Loading installed modules...");
  const [homePrompt, setHomePrompt] = useState("");
  const [input, setInput] = useState("My printer has white streaks.");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  const installedModule = modules[0];
  const selectedWorkspace = currentWorkspace;

  const chatPayload = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim().length > 0)
        .map((message) => ({
          role: message.role,
          content: message.content
        })),
    [messages]
  );

  const totalDocuments = useMemo(
    () =>
      selectedWorkspace?.documentStats.reduce((sum, item) => sum + item.count, 0) ?? 0,
    [selectedWorkspace]
  );

  useEffect(() => {
    if (!isSignedIn) return;

    fetch(modulesEndpoint)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Modules API responded with ${response.status}`);
        }
        return (await response.json()) as ModulesResponse;
      })
      .then((modulesData) => {
        setModules(modulesData.registry.modules);
        setStatus(
          modulesData.discoveryErrors.length
            ? "Module registry loaded with discovery warnings."
            : "Module registry loaded."
        );
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Unable to load modules.");
      });
  }, [isSignedIn]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function streamChat(trimmedInput: string) {
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmedInput
    };
    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: ""
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspace?.id,
          messages: [...chatPayload, { role: "user", content: trimmedInput }]
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat API responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        buffer += decoder.decode(result.value ?? new Uint8Array(), { stream: !done });
        const parsed = parseServerSentEvents(buffer);
        buffer = parsed.remaining;

        for (const streamEvent of parsed.events) {
          if (streamEvent.event === "metadata" && isChatMetadata(streamEvent.data)) {
            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, metadata: streamEvent.data as ChatMetadata }
                  : message
              )
            );
          }

          if (streamEvent.event === "delta" && hasTextDelta(streamEvent.data)) {
            const deltaText = streamEvent.data.text;
            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: `${message.content}${deltaText}` }
                  : message
              )
            );
          }

          if (streamEvent.event === "error" && hasErrorMessage(streamEvent.data)) {
            const errorMessage = streamEvent.data.message;
            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === assistantMessage.id
                  ? {
                      ...message,
                      content: `I could not complete the AI response yet: ${errorMessage}`
                    }
                  : message
              )
            );
          }

          if (streamEvent.event === "guardrail") {
            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === assistantMessage.id
                  ? {
                      ...message,
                      content: `${message.content}\n\n> Buek Core guardrails reviewed this response.`
                    }
                  : message
              )
            );
          }
        }
      }
    } catch (error) {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: error instanceof Error ? error.message : "Unable to reach the chat API."
              }
            : message
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;
    setInput("");
    await streamChat(trimmedInput);
  }

  async function handleHomePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedInput = homePrompt.trim();
    if (!trimmedInput || isStreaming) return;
    setHomePrompt("");
    setInput(trimmedInput);
    setActiveView("chat");
    await streamChat(trimmedInput);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoginError(null);
      const response = await fetch(loginEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, username, password })
      });

      if (!response.ok) {
        throw new Error("Invalid demo credentials.");
      }

      const data = (await response.json()) as LoginResponse;

      setCurrentUser(data.user);
      setCurrentWorkspace(data.workspace);
      setIsSignedIn(true);
      setActiveView("home");
      setExpandedPanel(null);
      setMessages([
        {
          id: createMessageId(),
          role: "assistant",
          content:
            "Hi, I am Buek Core. Tell me what you want to solve today, and I will open the right knowledge when needed."
        }
      ]);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  function handleLogout() {
    setIsSignedIn(false);
    setCurrentUser(null);
    setCurrentWorkspace(null);
    setActiveView("home");
    setExpandedPanel(null);
    setMessages([]);
  }

  function handleQuickAction(action: string) {
    if (action === "AI Worker") {
      setActiveView("chat");
      return;
    }
    if (action.startsWith("Upload")) {
      setActiveView("workspace");
      return;
    }
    const panel = mapQuickActionToPanel(action);
    if (panel) {
      setExpandedPanel(panel);
    }
  }

  function renderDetailPanel() {
    if (!expandedPanel || !selectedWorkspace) return null;

    const panelTitles: Record<NonNullable<DetailPanel>, string> = {
      factory: "Factory Overview",
      production: "Production",
      maintenance: "Maintenance",
      quality: "Quality",
      kpi: "KPI Dashboard"
    };

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
        <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Progressive Detail</p>
              <h3 className="mt-2 text-2xl font-semibold">{panelTitles[expandedPanel]}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {selectedWorkspace.plant} • {selectedWorkspace.shift}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpandedPanel(null)}
              className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 hover:border-cyan-300/50"
            >
              Close
            </button>
          </div>

          {expandedPanel === "kpi" || expandedPanel === "factory" || expandedPanel === "production" ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {selectedWorkspace.kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
                  <span className={kpiStatusColor(kpi.status)}>●</span>
                </div>
              ))}
            </div>
          ) : null}

          {expandedPanel === "quality" ? (
            <div className="mt-6 space-y-3">
              {selectedWorkspace.alerts.map((alert) => (
                <div key={alert.message} className={`rounded-2xl p-4 text-sm ${alertStyle(alert.severity)}`}>
                  ⚠ {alert.message}
                </div>
              ))}
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <p className="text-sm font-semibold">Knowledge Collections</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedWorkspace.knowledgeCollections.map((collection) => (
                    <span key={collection} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                      {collection}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {expandedPanel === "maintenance" ? (
            <div className="mt-6 space-y-3">
              {selectedWorkspace.alerts
                .filter((alert) => alert.message.toLowerCase().includes("machine") || alert.message.toLowerCase().includes("calibration"))
                .map((alert) => (
                  <div key={alert.message} className={`rounded-2xl p-4 text-sm ${alertStyle(alert.severity)}`}>
                    ⚠ {alert.message}
                  </div>
                ))}
              <p className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                Maintenance data is scoped to this workspace. Ask the AI Worker for machine-specific
                troubleshooting steps from your uploaded SOPs.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setExpandedPanel(null);
                setActiveView("chat");
              }}
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              Ask AI Worker
            </Button>
            <button
              type="button"
              onClick={() => setExpandedPanel(null)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderSidebar() {
    if (!selectedWorkspace || !currentUser) return null;

    const navItems: Array<{ id: ActiveView; label: string }> = [
      { id: "home", label: "Home" },
      { id: "chat", label: "AI Worker" },
      { id: "workspace", label: "Workspace" },
      { id: "settings", label: "Settings" }
    ];

    return (
      <aside className="flex w-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/20 lg:w-64 lg:shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo-mark.svg" alt="Buek Core logo" className="h-12 w-12 rounded-2xl bg-white p-2" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Buek Core</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Enterprise AI OS</p>
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveView(item.id);
                if (item.id !== "home") setExpandedPanel(null);
              }}
              className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${
                activeView === item.id
                  ? "bg-cyan-400/15 font-semibold text-cyan-200"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Workspace</p>
          <p className="mt-2 font-semibold">{selectedWorkspace.name}</p>
          <p className="mt-1 text-xs text-slate-400">{selectedWorkspace.organization}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-cyan-200">
            {selectedWorkspace.industry}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">AI Worker</p>
          <p className="mt-2 text-sm font-semibold">{selectedWorkspace.aiWorker}</p>
          <p className="mt-1 text-xs text-slate-400">{installedModule?.name ?? "Manufacturing"}</p>
        </div>

        <div className="mt-auto pt-6">
          <p className="text-xs text-slate-400">{currentUser.name}</p>
          <p className="text-[10px] text-slate-500">{currentUser.role}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-red-400/40 hover:text-red-200"
          >
            Sign Out
          </button>
        </div>
      </aside>
    );
  }

  function renderHomeView() {
    if (!selectedWorkspace || !currentUser) return null;

    const hasCriticalAlert = selectedWorkspace.alerts.some((a) => a.severity === "critical");
    const factoryStatus = hasCriticalAlert ? "attention" : "normal";

    return (
      <section className="flex-1 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/30">
        <header>
          <p className="text-sm text-cyan-300">Good morning, {currentUser.name}</p>
          <h1 className="mt-2 text-3xl font-bold">{selectedWorkspace.organization}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {selectedWorkspace.industry} • {selectedWorkspace.domain} • Plant {selectedWorkspace.plant}
          </p>
        </header>

        <form onSubmit={handleHomePromptSubmit} className="mt-8">
          <label htmlFor="ai-prompt" className="sr-only">
            What can I help you with today?
          </label>
          <div className="relative">
            <input
              id="ai-prompt"
              type="text"
              value={homePrompt}
              onChange={(event) => setHomePrompt(event.target.value)}
              placeholder="What can I help you with today?"
              className="w-full rounded-2xl border border-white/10 bg-slate-800 px-5 py-4 pr-14 text-white placeholder-slate-400 outline-none ring-cyan-300 transition focus:ring-2"
            />
            <button
              type="submit"
              disabled={isStreaming}
              className="absolute inset-y-0 right-4 flex items-center text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
            >
              →
            </button>
          </div>
        </form>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Today&apos;s Summary</h3>
              <button
                type="button"
                onClick={() => setExpandedPanel("kpi")}
                className="text-xs text-cyan-300 hover:text-cyan-200"
              >
                View KPIs
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <p
                className={`rounded-2xl p-3 text-sm ${
                  factoryStatus === "normal"
                    ? "bg-emerald-400/10 text-emerald-200"
                    : "bg-yellow-400/10 text-yellow-200"
                }`}
              >
                {factoryStatus === "normal"
                  ? "🟢 Factory running normally"
                  : "🟡 Factory needs attention"}
              </p>
              {selectedWorkspace.alerts.slice(0, 3).map((alert) => (
                <p key={alert.message} className={`rounded-2xl p-3 text-sm ${alertStyle(alert.severity)}`}>
                  ⚠ {alert.message}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {selectedWorkspace.quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleQuickAction(action)}
                  className="rounded-xl bg-slate-950/70 px-3 py-3 text-sm text-slate-200 transition hover:bg-slate-800"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">AI Insights</h3>
            <div className="mt-4 space-y-2">
              {selectedWorkspace.aiInsights.map((insight) => (
                <p key={insight} className="rounded-2xl bg-cyan-300/10 p-3 text-sm text-cyan-50">
                  {insight}
                </p>
              ))}
            </div>
            <Button
              onClick={() => setActiveView("chat")}
              className="mt-4 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              Open Investigation
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {selectedWorkspace.kpis.map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={() => setExpandedPanel("kpi")}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left transition hover:border-cyan-300/30"
            >
              <p className="text-xs text-slate-400">{kpi.label}</p>
              <p className="mt-1 text-xl font-bold">{kpi.value}</p>
              <span className={`text-sm ${kpiStatusColor(kpi.status)}`}>●</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Knowledge Source: {selectedWorkspace.organization} Workspace • {totalDocuments} documents •
          Version {selectedWorkspace.knowledgeVersion}
        </p>
      </section>
    );
  }

  function renderChatView() {
    if (!selectedWorkspace) return null;

    return (
      <section className="flex min-h-[calc(100vh-8rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
        <header className="border-b border-white/10 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-cyan-300">AI Worker</p>
              <h2 className="text-2xl font-semibold">{selectedWorkspace.aiWorker}</h2>
              <p className="mt-1 text-xs text-slate-400">
                Workspace: {selectedWorkspace.name} • Module: {installedModule?.name ?? "Manufacturing"} •
                Knowledge v{selectedWorkspace.knowledgeVersion}
              </p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
              {isStreaming ? "Streaming..." : "Ready"}
            </span>
          </div>
          <p className="mt-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
            Knowledge Source: {selectedWorkspace.organization} Workspace
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {messages.map((message) => (
            <article
              key={message.id}
              className={message.role === "user" ? "ml-auto max-w-3xl" : "max-w-4xl"}
            >
              <div
                className={
                  message.role === "user"
                    ? "rounded-3xl bg-cyan-400 px-5 py-4 text-slate-950"
                    : "rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-slate-100"
                }
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                  {message.role === "user" ? "You" : "Buek Core"}
                </p>
                {message.metadata ? (
                  <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Workspace</p>
                        <p className="mt-1 font-semibold">{message.metadata.workspace.name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Module</p>
                        <p className="mt-1 font-semibold">{message.metadata.detectedModule.name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">References</p>
                        <p className="mt-1 text-sm">
                          {message.metadata.references
                            .slice(0, 4)
                            .map((ref) => ref.referenceId ?? ref.id)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-cyan-200/10 pt-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                        Knowledge Retrieved
                      </p>
                      <div className="mt-3 grid gap-2">
                        {message.metadata.references.slice(0, 3).map((reference) => (
                          <div
                            key={`${message.id}-${reference.id}`}
                            className="rounded-xl border border-white/10 bg-slate-950/50 p-3"
                          >
                            <p className="text-sm font-semibold">
                              {reference.referenceId ?? reference.id}
                            </p>
                            <p className="mt-1 text-xs text-slate-300">{reference.title}</p>
                            {reference.excerpt ? (
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                                {reference.excerpt}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-7">
                  {message.content ||
                    (message.role === "assistant" && isStreaming ? "Thinking..." : "")}
                </div>
              </div>
            </article>
          ))}
          <div ref={conversationEndRef} />
        </div>

        <form onSubmit={handleChatSubmit} className="border-t border-white/10 bg-slate-950/60 p-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="What can I help you with today?"
              className="min-h-14 flex-1 resize-none rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-slate-950 outline-none ring-cyan-300 transition focus:ring-2"
            />
            <Button
              disabled={isStreaming}
              className="self-end bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </Button>
          </div>
        </form>
      </section>
    );
  }

  function renderWorkspaceView() {
    if (!selectedWorkspace) return null;

    return (
      <section className="flex-1 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold">Workspace Information</h2>
        <p className="mt-2 text-sm text-slate-400">Data scope: this workspace only</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Company", selectedWorkspace.organization],
            ["Industry", selectedWorkspace.industry],
            ["Domain", selectedWorkspace.domain],
            ["Plant", selectedWorkspace.plant],
            ["Shift", selectedWorkspace.shift],
            ["Knowledge", `${totalDocuments} documents`],
            ["Version", selectedWorkspace.knowledgeVersion],
            ["AI Worker", selectedWorkspace.aiWorker],
            ["Status", selectedWorkspace.status]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
              <p className="mt-2 font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Knowledge Base</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {selectedWorkspace.documentStats.map((item) => (
              <div
                key={item.label}
                className="flex justify-between rounded-xl bg-slate-950/70 px-4 py-3"
              >
                <span className="text-sm text-slate-300">{item.label}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedWorkspace.status === "no-knowledge" ? (
          <div className="mt-6 rounded-3xl border border-dashed border-yellow-400/30 bg-yellow-400/5 p-6">
            <h3 className="font-semibold text-yellow-200">Onboarding Required</h3>
            <p className="mt-2 text-sm text-slate-300">
              Upload SOP, Work Instruction, and QC Standard to activate the AI worker for this
              workspace.
            </p>
          </div>
        ) : null}
      </section>
    );
  }

  function renderSettingsView() {
    return (
      <section className="flex-1 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="mt-2 text-sm text-slate-400">{status}</p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Installed Module</p>
            <p className="mt-2 font-semibold">{installedModule?.name ?? "Loading..."}</p>
            <p className="mt-1 text-sm text-slate-400">{installedModule?.description}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Capabilities</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {installedModule?.capabilities.map((cap) => (
                <span key={cap} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {!isSignedIn ? (
        <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
          <form
            onSubmit={handleLogin}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/30"
          >
            <div className="flex flex-col items-center text-center">
              <img
                src="/logo-mark.svg"
                alt="Buek Core logo"
                className="h-20 w-20 rounded-3xl bg-white p-3"
              />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Buek Core
              </p>
              <h1 className="mt-3 text-3xl font-bold">Build AI Workers for Any Industry</h1>
              <p className="mt-3 text-sm text-slate-400">Enterprise AI Operating System</p>
            </div>
            <label className="mt-8 block text-sm text-slate-300">
              Company ID
              <input
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none ring-cyan-300 focus:ring-2"
              />
            </label>
            <label className="mt-4 block text-sm text-slate-300">
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none ring-cyan-300 focus:ring-2"
              />
            </label>
            <label className="mt-4 block text-sm text-slate-300">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none ring-cyan-300 focus:ring-2"
              />
            </label>
            {loginError ? (
              <p className="mt-4 text-center text-sm text-red-400">{loginError}</p>
            ) : null}
            <Button className="mt-6 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              Sign In
            </Button>
            <div className="mt-4 space-y-1 text-center text-xs text-slate-500">
              <p>Epson Demo / demo / demo123</p>
              <p>Toyota Demo / demo / demo123</p>
              <p>Nestle Demo / demo / demo123</p>
            </div>
          </form>
        </section>
      ) : (
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 lg:flex-row lg:p-6">
          {renderSidebar()}
          {activeView === "home" && renderHomeView()}
          {activeView === "chat" && renderChatView()}
          {activeView === "workspace" && renderWorkspaceView()}
          {activeView === "settings" && renderSettingsView()}
          {renderDetailPanel()}
        </div>
      )}
    </main>
  );
}
