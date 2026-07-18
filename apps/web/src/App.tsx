import type { AppNavItem } from "@buek/ui";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell.js";
import { ChatView } from "./components/ChatView.js";
import { HomeView } from "./components/HomeView.js";
import { LoginScreen } from "./components/LoginScreen.js";
import { SettingsView } from "./components/SettingsView.js";
import { WorkspaceView } from "./components/WorkspaceView.js";
import {
  createMessageId,
  hasErrorMessage,
  hasTextDelta,
  isChatMetadata,
  parseServerSentEvents
} from "./lib/chat.js";
import type { ChatMessage, DemoUser, ModuleSummary, Workspace } from "./types.js";

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const modulesEndpoint = `${configuredApiUrl}/api/modules`;
const loginEndpoint = `${configuredApiUrl}/api/auth/demo-login`;
const chatEndpoint = `${configuredApiUrl}/api/chat`;

interface ModulesResponse {
  registry: { modules: ModuleSummary[] };
  discoveryErrors: Array<{ moduleName: string; reason: string }>;
}

interface LoginResponse {
  user: DemoUser;
  workspace: Workspace;
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
  const [activeView, setActiveView] = useState<AppNavItem>("home");
  const [status, setStatus] = useState("Loading installed modules...");
  const [homePrompt, setHomePrompt] = useState("");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const installedModule = modules[0];

  const chatPayload = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim().length > 0)
        .map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  useEffect(() => {
    if (!isSignedIn) return;

    fetch(modulesEndpoint)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Modules API responded with ${response.status}`);
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
        setStatus(error instanceof Error ? error.message : "Unable to load modules.");
      });
  }, [isSignedIn]);

  async function streamChat(trimmedInput: string) {
    const userMessage: ChatMessage = { id: createMessageId(), role: "user", content: trimmedInput };
    const assistantMessage: ChatMessage = { id: createMessageId(), role: "assistant", content: "" };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace?.id,
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
            const metadata = streamEvent.data;
            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === assistantMessage.id ? { ...message, metadata } : message
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

  async function startChatFromPrompt(prompt: string) {
    const trimmedInput = prompt.trim();
    if (!trimmedInput || isStreaming) return;
    setInput("");
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

      if (!response.ok) throw new Error("Invalid demo credentials.");

      const data = (await response.json()) as LoginResponse;

      setCurrentUser(data.user);
      setCurrentWorkspace(data.workspace);
      setIsSignedIn(true);
      setActiveView("home");
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
    setMessages([]);
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <LoginScreen
          companyId={companyId}
          username={username}
          password={password}
          loginError={loginError}
          onCompanyIdChange={setCompanyId}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
        />
      </main>
    );
  }

  if (!currentUser || !currentWorkspace) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppShell activeView={activeView} onNavigate={setActiveView} onLogout={handleLogout}>
        {activeView === "home" ? (
          <HomeView
            user={currentUser}
            workspace={currentWorkspace}
            homePrompt={homePrompt}
            isStreaming={isStreaming}
            onHomePromptChange={setHomePrompt}
            onHomePromptSubmit={() => startChatFromPrompt(homePrompt)}
            onContinueItem={startChatFromPrompt}
          />
        ) : null}

        {activeView === "chat" ? (
          <ChatView
            workspace={currentWorkspace}
            messages={messages}
            input={input}
            isStreaming={isStreaming}
            onInputChange={setInput}
            onSubmit={async (trimmedInput) => {
              await streamChat(trimmedInput);
            }}
          />
        ) : null}

        {activeView === "workspace" ? <WorkspaceView workspace={currentWorkspace} /> : null}

        {activeView === "settings" ? (
          <SettingsView
            status={status}
            installedModule={installedModule ?? undefined}
          />
        ) : null}
      </AppShell>
    </main>
  );
}
