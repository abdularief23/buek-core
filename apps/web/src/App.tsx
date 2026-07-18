import type { AppNavItem } from "@buek/ui";
import { useEffect, useMemo, useState } from "react";
import { AiCopilot } from "./components/AiCopilot.js";
import { AiWorkspaceView } from "./components/AiWorkspaceView.js";
import { AppShell } from "./components/AppShell.js";
import { HomeView } from "./components/HomeView.js";
import { KnowledgeView } from "./components/KnowledgeView.js";
import { LoginScreen } from "./components/LoginScreen.js";
import { NotificationsPanel } from "./components/NotificationsPanel.js";
import { ProfileView } from "./components/ProfileView.js";
import { SettingsView } from "./components/SettingsView.js";
import { WorkflowView } from "./components/WorkflowView.js";
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [aiContext, setAiContext] = useState<AiContext>({ label: "Home" });

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
    if (isSignedIn && currentUser) {
      setAiContext(contextForView(activeView, currentUser.role));
    }
  }, [activeView, isSignedIn, currentUser]);

  function completeSignIn(data: LoginResponse) {
    setCurrentUser(data.user);
    setCurrentWorkspace(data.workspace);
    setIsSignedIn(true);
    setActiveView("home");
    setMessages([]);
    setInput("");
    setLoginError(null);
    setAiContext({ label: "Home" });
    setCopilotOpen(false);
    setNotificationsOpen(false);
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

  function handleContextualAsk(
    prompt: string,
    contextLabel: string,
    details?: string[]
  ) {
    const context: AiContext = {
      label: contextLabel,
      details,
      promptPrefix: `[Context: ${contextLabel}] `
    };
    setAiContext(context);
    void streamChat(prompt, context);
  }

  function handleHomeAsk(prompt: string) {
    void streamChat(prompt, { label: "Home" });
  }

  function handleCopilotSubmit(trimmedInput: string) {
    return streamChat(trimmedInput, aiContext);
  }

  function handleSuggestion(prompt: string) {
    void streamChat(prompt, aiContext);
  }

  function handleGlobalSearch(query: string) {
    handleContextualAsk(`Search: ${query}`, "Global Search");
  }

  function handleLogout() {
    setIsSignedIn(false);
    setCurrentUser(null);
    setCurrentWorkspace(null);
    setActiveView("home");
    setMessages([]);
    setInput("");
    setCopilotOpen(false);
    setNotificationsOpen(false);
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
        user={currentUser}
        organization={currentWorkspace.organization}
        onNavigate={setActiveView}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onLogout={handleLogout}
        onSearch={handleGlobalSearch}
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
            onSuggestion={handleSuggestion}
          />
        }
      >
        {activeView === "home" ? (
          <HomeView
            user={currentUser}
            workspace={currentWorkspace}
            input={input}
            isStreaming={isStreaming}
            onInputChange={setInput}
            onAsk={handleHomeAsk}
            onBriefAction={(prompt, label) =>
              handleContextualAsk(prompt, label, [
                currentWorkspace.organization,
                currentUser.role,
                currentWorkspace.shift
              ])
            }
            onContinue={(prompt, label) => handleContextualAsk(prompt, label)}
          />
        ) : null}

        {activeView === "workspace" ? (
          <AiWorkspaceView
            workspace={currentWorkspace}
            onFocusSelect={(prompt, label) => handleContextualAsk(prompt, label)}
            onKpiSelect={(prompt) => handleContextualAsk(prompt, "Today's KPI")}
          />
        ) : null}

        {activeView === "knowledge" ? (
          <KnowledgeView
            workspace={currentWorkspace}
            onSearch={(query) => handleContextualAsk(query, "Knowledge")}
          />
        ) : null}

        {activeView === "workflow" ? (
          <WorkflowView onAsk={(prompt) => handleContextualAsk(prompt, "Workflow")} />
        ) : null}

        {activeView === "profile" ? (
          <ProfileView
            workspace={currentWorkspace}
            user={currentUser}
            installedModule={installedModule}
          />
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

      <NotificationsPanel
        workspace={currentWorkspace}
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onSelect={(prompt, label) => handleContextualAsk(prompt, label)}
      />
    </main>
  );
}
