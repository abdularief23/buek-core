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
const workspacesEndpoint = `${configuredApiUrl}/api/workspaces`;
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

interface WorkspacesResponse {
  workspaces: Workspace[];
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

export function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [companyId, setCompanyId] = useState("Epson Demo");
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo123");
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "chat">("dashboard");
  const [status, setStatus] = useState("Loading installed modules...");
  const [input, setInput] = useState("My printer has white streaks.");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId(),
      role: "assistant",
      content:
        "Hi, I am Buek Core. Ask about a manufacturing issue and I will route it to the installed Manufacturing module."
    }
  ]);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  const installedModule = modules[0];
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId);

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

  useEffect(() => {
    Promise.all([
      fetch(modulesEndpoint).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Modules API responded with ${response.status}`);
        }

        return (await response.json()) as ModulesResponse;
      }),
      fetch(workspacesEndpoint).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Workspaces API responded with ${response.status}`);
        }

        return (await response.json()) as WorkspacesResponse;
      })
    ])
      .then(([modulesData, workspacesData]) => {
        setModules(modulesData.registry.modules);
        setWorkspaces(workspacesData.workspaces);
        setStatus(
          modulesData.discoveryErrors.length
            ? "Module registry loaded with discovery warnings."
            : "Module registry loaded."
        );
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Unable to load workspace.");
      });
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || isStreaming) {
      return;
    }

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
    const nextMessages = [...messages, userMessage, assistantMessage];

    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
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

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSignedIn(true);
  }

  function selectWorkspace(workspaceId: string) {
    setSelectedWorkspaceId(workspaceId);
    setActiveView("dashboard");
    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        content:
          "Hi, I am Buek Core. I will use the active workspace, installed module, and retrieved company knowledge to help you."
      }
    ]);
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
            </div>
            <label className="mt-8 block text-sm text-slate-300">
              Company ID
              <input
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-300 focus:ring-2"
              />
            </label>
            <label className="mt-4 block text-sm text-slate-300">
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-300 focus:ring-2"
              />
            </label>
            <label className="mt-4 block text-sm text-slate-300">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-300 focus:ring-2"
              />
            </label>
            <Button className="mt-6 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              Sign In
            </Button>
            <p className="mt-4 text-center text-xs text-slate-500">
              Demo account: Epson Demo / demo / demo123
            </p>
          </form>
        </section>
      ) : !selectedWorkspace ? (
        <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <img
                src="/logo-mark.svg"
                alt="Buek Core logo"
                className="h-20 w-20 rounded-3xl bg-white p-3 shadow-2xl shadow-cyan-950/30"
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  Buek Core
                </p>
                <h1 className="mt-2 text-5xl font-bold tracking-tight">Choose Workspace</h1>
              </div>
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Buek Core is a knowledge platform for AI workers. Select an organization workspace;
              the AI Core stays the same while industry module and uploaded knowledge change per
              customer.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => selectWorkspace(workspace.id)}
                className="rounded-3xl border border-cyan-300/20 bg-white/5 p-6 text-left transition hover:border-cyan-300/60 hover:bg-cyan-300/10"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  {workspace.industry}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{workspace.name}</h2>
                <p className="mt-2 text-sm text-slate-300">{workspace.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {workspace.knowledgeCollections.map((collection) => (
                    <span key={collection} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                      {collection}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.03] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Coming Soon
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-300">+ Create New Workspace</h2>
              <p className="mt-2 text-sm text-slate-500">
                Choose industry, describe what you manufacture, upload SOPs, approve, and publish
                knowledge to the AI worker.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20">
            <div className="flex items-center gap-4">
              <img
                src="/logo-mark.svg"
                alt="Buek Core logo"
                className="h-16 w-16 rounded-2xl bg-white p-2 shadow-lg shadow-cyan-950/30"
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  Buek Core
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  Modular AI Platform
                </p>
              </div>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Build AI Workers for Any Industry
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              One AI Core with modular domain knowledge. This workspace uses a Manufacturing module
              and uploaded company knowledge.
            </p>

            <button
              type="button"
              onClick={() => setSelectedWorkspaceId(null)}
              className="mt-5 rounded-full border border-white/10 px-4 py-2 text-xs text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-200"
            >
              Change Workspace
            </button>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Workspace</p>
              <h2 className="mt-2 text-xl font-semibold">{selectedWorkspace.name}</h2>
              <p className="mt-1 text-sm text-slate-300">{selectedWorkspace.organization}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-cyan-200">
                {selectedWorkspace.industry} / {selectedWorkspace.domain}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Installed Module
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {installedModule?.name ?? "Loading..."}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {installedModule?.description ?? status}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {installedModule?.capabilities.map((capability) => (
                  <span key={capability} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Data Scope</p>
              <p className="mt-2 text-sm text-emerald-200">This workspace only</p>
              <p className="mt-1 text-xs text-slate-500">
                Company ID: {selectedWorkspace.companyId}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Module Discovery</h3>
              <p className="text-sm text-slate-400">{status}</p>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Prompts</p>
                <p className="mt-2 text-sm text-slate-300">
                  {installedModule?.prompts.map((prompt) => prompt.name).join(", ") ?? "Loading"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tools</p>
                <p className="mt-2 text-sm text-slate-300">
                  {installedModule?.tools.map((tool) => tool.name).join(", ") ?? "Loading"}
                </p>
              </div>
            </div>
          </aside>

          {activeView === "dashboard" ? (
            <section className="min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/30">
              <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-cyan-300">Manufacturing Workspace</p>
                    <h2 className="mt-2 text-3xl font-bold">{selectedWorkspace.name}</h2>
                    <p className="mt-2 text-slate-300">
                      Plant: {selectedWorkspace.plant} • {selectedWorkspace.shift}
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveView("chat")}
                    className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  >
                    Open AI Worker →
                  </Button>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-5">
                  <div className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Company</p>
                    <p className="mt-2 font-semibold">{selectedWorkspace.organization}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Industry</p>
                    <p className="mt-2 font-semibold">{selectedWorkspace.industry}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Knowledge</p>
                    <p className="mt-2 font-semibold">
                      {selectedWorkspace.documentStats.reduce((sum, item) => sum + item.count, 0)}{" "}
                      Docs
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Version</p>
                    <p className="mt-2 font-semibold">{selectedWorkspace.knowledgeVersion}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Worker</p>
                    <p className="mt-2 font-semibold">{selectedWorkspace.aiWorker}</p>
                  </div>
                </div>
              </header>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold">KPI Today</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-5">
                    {selectedWorkspace.kpis.map((kpi) => (
                      <div key={kpi.label} className="rounded-2xl bg-slate-950/70 p-4">
                        <p className="text-xs text-slate-400">{kpi.label}</p>
                        <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
                        <span
                          className={
                            kpi.status === "green"
                              ? "text-emerald-300"
                              : kpi.status === "yellow"
                                ? "text-yellow-300"
                                : "text-red-300"
                          }
                        >
                          ●
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold">Knowledge Base</h3>
                  <div className="mt-4 space-y-2">
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
                </section>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold">Alerts</h3>
                  <div className="mt-4 space-y-3">
                    {selectedWorkspace.alerts.map((alert) => (
                      <div key={alert.message} className="rounded-2xl bg-slate-950/70 p-4 text-sm">
                        <span
                          className={
                            alert.severity === "critical" ? "text-red-300" : "text-yellow-300"
                          }
                        >
                          ⚠
                        </span>{" "}
                        {alert.message}
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold">AI Insights</h3>
                  <div className="mt-4 space-y-3">
                    {selectedWorkspace.aiInsights.map((insight) => (
                      <p
                        key={insight}
                        className="rounded-2xl bg-cyan-300/10 p-4 text-sm text-cyan-50"
                      >
                        “{insight}”
                      </p>
                    ))}
                  </div>
                </section>
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold">Quick Action</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {selectedWorkspace.quickActions.map((action) => (
                      <button
                        key={action}
                        className="rounded-xl bg-slate-950/70 px-3 py-3 text-sm text-slate-200"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <section className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
                <h3 className="text-lg font-semibold">Architecture Scope</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  {["AI Core", "Business Modules", "Connectors", "AI Services"].map((layer) => (
                    <div key={layer} className="rounded-2xl bg-slate-950/70 p-4">
                      <p className="font-semibold">{layer}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {layer === "AI Core"
                          ? "Chat, memory, workflow, tools, RAG, guardrails"
                          : layer === "Business Modules"
                            ? "Production, Quality, Maintenance, Engineering, Inventory"
                            : layer === "Connectors"
                              ? "ERP, MES, CMMS, SCADA, Excel, SQL, IoT"
                              : "KPI insight, anomaly, RCA, summary, automation"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          ) : (
            <section className="flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
              <header className="border-b border-white/10 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo-mark.svg"
                      alt=""
                      className="h-10 w-10 rounded-xl bg-white p-1.5"
                    />
                    <div>
                      <p className="text-sm text-cyan-300">AI Chat</p>
                      <h2 className="text-2xl font-semibold">Manufacturing Worker Demo</h2>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                    {isStreaming ? "Streaming..." : "Ready"}
                  </span>
                </div>
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
                              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                                Workspace
                              </p>
                              <p className="mt-1 font-semibold">
                                {message.metadata.workspace.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-300">
                                {message.metadata.workspace.domain}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                                Detected Module
                              </p>
                              <p className="mt-1 font-semibold">
                                {message.metadata.detectedModule.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                                References
                              </p>
                              <p className="mt-1 text-sm">
                                {message.metadata.references
                                  .slice(0, 4)
                                  .map((reference) => reference.referenceId ?? reference.id)
                                  .join(", ")}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 border-t border-cyan-200/10 pt-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                              Knowledge Engine Retrieved
                            </p>
                            <div className="mt-3 grid gap-2">
                              {message.metadata.references.slice(0, 3).map((reference) => (
                                <div
                                  key={`${message.id}-${reference.id}`}
                                  className="rounded-xl border border-white/10 bg-slate-950/50 p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold">
                                      {reference.referenceId ?? reference.id}
                                    </p>
                                    {typeof reference.score === "number" ? (
                                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                                        score {reference.score}
                                      </span>
                                    ) : null}
                                  </div>
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

              <form
                onSubmit={handleSubmit}
                className="border-t border-white/10 bg-slate-950/60 p-4"
              >
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
                    placeholder="Ask: My printer has white streaks."
                    className="min-h-14 flex-1 resize-none rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-slate-950 outline-none ring-cyan-300 transition focus:ring-2"
                  />
                  <Button
                    disabled={isStreaming}
                    className="self-end bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Demo target: workspace → industry module → knowledge retrieval → OpenAI reasoning
                  → cited answer.
                </p>
              </form>
            </section>
          )}
        </section>
      )}
    </main>
  );
}
