import type { AppNavItem } from "@buek/ui";
import { useEffect, useMemo, useState } from "react";
import { AskBuekView } from "./components/AskBuekView.js";
import { AppShell } from "./components/AppShell.js";
import { HomeView } from "./components/HomeView.js";
import { KnowledgeView } from "./components/KnowledgeView.js";
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
const signInEndpoint = `${configuredApiUrl}/api/auth/sign-in`;
const demoLaunchEndpoint = `${configuredApiUrl}/api/auth/demo-launch`;
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
  const [loginError, setLoginError] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [activeView, setActiveView] = useState<AppNavItem>("home");
  const [status, setStatus] = useState("Loading installed modules...");
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

  function completeSignIn(data: LoginResponse) {
    setCurrentUser(data.user);
    setCurrentWorkspace(data.workspace);
    setIsSignedIn(true);
    setActiveView("home");
    setMessages([]);
    setInput("");
    setLoginError(null);
  }

  async function handleProductionSignIn(email: string, password: string) {
    try {
      setLoginError(null);
      const response = await fetch(signInEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) throw new Error("Invalid email or password.");

      completeSignIn((await response.json()) as LoginResponse);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  async function handleDemoLaunch(workspaceId: string, role: string) {
    try {
      setLoginError(null);
      const response = await fetch(demoLaunchEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, role })
      });

      if (!response.ok) throw new Error("Unable to launch demo workspace.");

      completeSignIn((await response.json()) as LoginResponse);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to launch demo.");
    }
  }

  async function streamChat(trimmedInput: string) {
    setActiveView("ask");

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

  function handleAsk(prompt: string) {
    void streamChat(prompt);
  }

  function handleLogout() {
    setIsSignedIn(false);
    setCurrentUser(null);
    setCurrentWorkspace(null);
    setActiveView("home");
    setMessages([]);
    setInput("");
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <LoginScreen
          loginError={loginError}
          onProductionSignIn={handleProductionSignIn}
          onDemoLaunch={handleDemoLaunch}
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
            input={input}
            isStreaming={isStreaming}
            onInputChange={setInput}
            onAsk={handleAsk}
          />
        ) : null}

        {activeView === "ask" ? (
          <AskBuekView
            workspace={currentWorkspace}
            messages={messages}
            input={input}
            isStreaming={isStreaming}
            onInputChange={setInput}
            onSubmit={streamChat}
          />
        ) : null}

        {activeView === "knowledge" ? <KnowledgeView workspace={currentWorkspace} /> : null}

        {activeView === "workspace" ? (
          <WorkspaceView
            workspace={currentWorkspace}
            user={currentUser}
            installedModule={installedModule}
          />
        ) : null}

        {activeView === "settings" ? (
          <SettingsView status={status} installedModule={installedModule} />
        ) : null}
      </AppShell>
    </main>
  );
}
