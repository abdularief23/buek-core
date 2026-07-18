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
const chatEndpoint = `${configuredApiUrl}/api/chat`;

interface ChatReference {
  id: string;
  title: string;
  referenceId?: string;
}

interface ChatMetadata {
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
  const [modules, setModules] = useState<ModuleSummary[]>([]);
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
    fetch(modulesEndpoint)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API responded with ${response.status}`);
        }

        return (await response.json()) as ModulesResponse;
      })
      .then((data) => {
        setModules(data.registry.modules);
        setStatus(
          data.discoveryErrors.length
            ? "Module registry loaded with discovery warnings."
            : "Module registry loaded."
        );
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Unable to load module registry.");
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
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
            One AI Core with modular domain knowledge. This demo routes manufacturing issues to the
            Manufacturing plugin without changing AI Core.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Installed Module
            </p>
            <h2 className="mt-2 text-xl font-semibold">{installedModule?.name ?? "Loading..."}</h2>
            <p className="mt-2 text-sm text-slate-300">{installedModule?.description ?? status}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {installedModule?.capabilities.map((capability) => (
                <span key={capability} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  {capability}
                </span>
              ))}
            </div>
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

        <section className="flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
          <header className="border-b border-white/10 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src="/logo-mark.svg" alt="" className="h-10 w-10 rounded-xl bg-white p-1.5" />
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
                    <div className="mb-4 grid gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                          Detected Module
                        </p>
                        <p className="mt-1 font-semibold">{message.metadata.detectedModule.name}</p>
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

          <form onSubmit={handleSubmit} className="border-t border-white/10 bg-slate-950/60 p-4">
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
              Demo target: detect Manufacturing, load module knowledge, stream structured
              troubleshooting, and cite references.
            </p>
          </form>
        </section>
      </section>
    </main>
  );
}
