import type { AppNavItem } from "@buek/ui";
import { useEffect, useMemo, useState } from "react";
import { AiCopilot } from "./components/AiCopilot.js";
import { AppShell } from "./components/AppShell.js";
import { HomeView } from "./components/HomeView.js";
import { KnowledgeView } from "./components/KnowledgeView.js";
import { LoginScreen } from "./components/LoginScreen.js";
import { NotificationsView } from "./components/NotificationsView.js";
import { ProactiveAiModal } from "./components/ProactiveAiModal.js";
import { SettingsView } from "./components/SettingsView.js";
import {
  createMessageId,
  hasErrorMessage,
  hasTextDelta,
  isChatMetadata,
  parseServerSentEvents
} from "./lib/chat.js";
import { contextForView, withContextPrompt, type AiContext } from "./lib/context.js";
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
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [showProactiveModal, setShowProactiveModal] = useState(false);
  const [aiContext, setAiContext] = useState<AiContext>({ label: "Daily Workspace" });

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

  useEffect(() => {
    if (isSignedIn) {
      setAiContext(contextForView(activeView));
    }
  }, [activeView, isSignedIn]);

  function completeSignIn(data: LoginResponse) {
    setCurrentUser(data.user);
    setCurrentWorkspace(data.workspace);
    setIsSignedIn(true);
    setActiveView("home");
    setMessages([]);
    setInput("");
    setLoginError(null);
    setAiContext({ label: "Daily Workspace" });
    setShowProactiveModal(data.workspace.dailyWorkspace.proactiveCards.length > 0);
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

  async function streamChat(trimmedInput: string, context: AiContext = aiContext) {
    const contextualPrompt = withContextPrompt(context, trimmedInput);

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: contextualPrompt
    };
    const assistantMessage: ChatMessage = { id: createMessageId(), role: "assistant", content: "" };

    setCopilotOpen(true);
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace?.id,
          messages: [...chatPayload, { role: "user", content: contextualPrompt }]
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

  function handleContextualAsk(prompt: string, contextLabel: string) {
    const context: AiContext = {
      label: contextLabel,
      promptPrefix: `[Context: ${contextLabel}] `
    };
    setAiContext(context);
    void streamChat(prompt, context);
  }

  function handleCopilotSubmit(trimmedInput: string) {
    return streamChat(trimmedInput, aiContext);
  }

  function handleProactiveCard(prompt: string, contextLabel: string) {
    setShowProactiveModal(false);
    handleContextualAsk(prompt, contextLabel);
  }

  function handleLogout() {
    setIsSignedIn(false);
    setCurrentUser(null);
    setCurrentWorkspace(null);
    setActiveView("home");
    setMessages([]);
    setInput("");
    setCopilotOpen(false);
    setShowProactiveModal(false);
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

  const notificationCount = currentWorkspace.dailyWorkspace.notifications.length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppShell
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={handleLogout}
        notificationCount={notificationCount}
        copilot={
          <AiCopilot
            user={currentUser}
            workspace={currentWorkspace}
            context={aiContext}
            open={copilotOpen}
            messages={messages}
            input={input}
            isStreaming={isStreaming}
            onToggle={() => setCopilotOpen((current) => !current)}
            onInputChange={setInput}
            onSubmit={handleCopilotSubmit}
          />
        }
      >
        {activeView === "home" ? (
          <HomeView
            user={currentUser}
            workspace={currentWorkspace}
            onAction={handleContextualAsk}
          />
        ) : null}

        {activeView === "knowledge" ? (
          <KnowledgeView workspace={currentWorkspace} onAsk={handleContextualAsk} />
        ) : null}

        {activeView === "notifications" ? (
          <NotificationsView workspace={currentWorkspace} onAsk={handleContextualAsk} />
        ) : null}

        {activeView === "settings" ? (
          <SettingsView
            workspace={currentWorkspace}
            user={currentUser}
            status={status}
            installedModule={installedModule}
          />
        ) : null}
      </AppShell>

      {showProactiveModal ? (
        <ProactiveAiModal
          workspace={currentWorkspace}
          onDismiss={() => setShowProactiveModal(false)}
          onSelectCard={handleProactiveCard}
        />
      ) : null}
    </main>
  );
}
