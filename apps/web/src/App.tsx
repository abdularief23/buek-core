import type { AppNavItem } from "@buek/ui";
import { useEffect, useMemo, useState, useCallback } from "react";
import { DynamicWorkspace, type DynamicWorkspaceState } from "./components/DynamicWorkspace.js";
import { AiCopilot, type AiAssistantMode } from "./components/AiCopilot.js";
import { AiWorkspaceView } from "./components/AiWorkspaceView.js";
import { AppShell } from "./components/AppShell.js";
import { HomeView } from "./components/HomeView.js";
import { KnowledgeView } from "./components/KnowledgeView.js";
import { LoginScreen } from "./components/LoginScreen.js";
import { NotificationsPanel } from "./components/NotificationsPanel.js";
import { ProfileView } from "./components/ProfileView.js";
import { WorkflowView } from "./components/WorkflowView.js";
import { applyTenantTheme, tenantPrimaryIssueKey } from "./lib/tenant-theme.js";
import { getAppLanguage } from "./lib/user-preferences.js";
import {
  createMessageId,
  hasErrorMessage,
  hasTextDelta,
  isChatMetadata,
  parseServerSentEvents
} from "./lib/chat.js";
import { contextForView, withContextPrompt, type AiContext } from "./lib/context.js";
import { isAiActionResult, fetchNotifications, refreshRoleHome } from "./lib/data-api.js";
import { navItemsForRole } from "./lib/roles.js";
import type { ChatMessage, DemoUser, ModuleSummary, RoleHomeData, Workspace } from "./types.js";

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
  roleHome: RoleHomeData;
}

export function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [roleHome, setRoleHome] = useState<RoleHomeData | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [activeView, setActiveView] = useState<AppNavItem>("home");
  const [status, setStatus] = useState("Loading installed modules...");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [dynamicWorkspace, setDynamicWorkspace] = useState<DynamicWorkspaceState | null>(null);
  const [aiContext, setAiContext] = useState<AiContext>({ label: "Home" });
  const [inboxCount, setInboxCount] = useState(0);
  const [aiMode, setAiMode] = useState<AiAssistantMode>(null);

  const installedModule = modules[0];
  const allowedNavItems = useMemo(
    () => (currentUser ? navItemsForRole(currentUser.role) : (["home", "profile"] as AppNavItem[])),
    [currentUser]
  );

  function handleNavigate(view: AppNavItem) {
    if (!allowedNavItems.includes(view)) return;
    setActiveView(view);
    if (view !== "home") {
      setDynamicWorkspace(null);
    }
  }

  const refreshLiveData = useCallback(async () => {
    if (!currentWorkspace || !currentUser) return;
    try {
      const [roleHomeRes, notifRes] = await Promise.all([
        refreshRoleHome(currentWorkspace.id, currentUser.role),
        fetchNotifications(currentWorkspace.id)
      ]);
      setRoleHome(roleHomeRes.roleHome);
      setInboxCount(notifRes.notifications.length);
    } catch {
      // Keep existing data on refresh failure.
    }
  }, [currentWorkspace, currentUser]);

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
    if (!isSignedIn || !currentWorkspace) return;
    fetchNotifications(currentWorkspace.id)
      .then((data) => setInboxCount(data.notifications.length))
      .catch(() => setInboxCount(0));
  }, [isSignedIn, currentWorkspace?.id]);

  useEffect(() => {
    if (isSignedIn && currentUser && roleHome) {
      setAiContext(contextForView(activeView, currentUser.role, roleHome));
    }
  }, [activeView, isSignedIn, currentUser, roleHome]);

  function completeSignIn(data: LoginResponse) {
    setCurrentUser(data.user);
    setCurrentWorkspace(data.workspace);
    setRoleHome(data.roleHome);
    applyTenantTheme(data.workspace.theme ?? null);
    setIsSignedIn(true);
    setActiveView("home");
    setMessages([]);
    setInput("");
    setLoginError(null);
    setAiContext(contextForView("home", data.user.role, data.roleHome));
    setCopilotOpen(false);
    setAiMode(null);
    setInboxOpen(false);
    setDynamicWorkspace(null);
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

  async function streamChat(
    trimmedInput: string,
    context: AiContext = aiContext,
    options: { openCopilot?: boolean } = {}
  ) {
    const { openCopilot = true } = options;
    const contextualPrompt = withContextPrompt(context, trimmedInput);

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmedInput
    };
    const assistantMessage: ChatMessage = { id: createMessageId(), role: "assistant", content: "" };

    if (openCopilot) {
      setCopilotOpen(true);
    }
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace?.id,
          role: currentUser?.role,
          chatPersona: roleHome?.chatPersona,
          language: getAppLanguage(),
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

          if (streamEvent.event === "action" && isAiActionResult(streamEvent.data)) {
            const action = streamEvent.data;
            const prefix = action.success ? `✓ ${action.message}\n\n` : `⚠ ${action.message}\n\n`;

            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: `${prefix}${message.content}` }
                  : message
              )
            );

            if (action.success && currentWorkspace) {
              const slug = currentWorkspace.id;
              void refreshLiveData();
              if (action.toolName === "create_work_order") {
                setDynamicWorkspace({ kind: "approval-queue", slug });
                setActiveView("home");
              } else if (action.toolName === "draft_report") {
                setDynamicWorkspace({ kind: "engineering-reports", slug });
                setActiveView("home");
              } else if (action.toolName === "start_investigation") {
                const issueKey = tenantPrimaryIssueKey(currentWorkspace.theme);
                setDynamicWorkspace({
                  kind: "investigation",
                  slug,
                  issueKey
                });
                setActiveView("home");
              }
            }
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

  function handleOpenDataPage(workspace: DynamicWorkspaceState) {
    setDynamicWorkspace(workspace);
    setActiveView("home");
  }

  function handleExplainAi(prompt: string, contextLabel: string, details?: string[]) {
    const context: AiContext = {
      label: contextLabel,
      ...(details ? { details } : {}),
      ...(roleHome?.chatPersona ? { chatPersona: roleHome.chatPersona } : {}),
      promptPrefix: ""
    };
    setAiContext(context);
    setAiMode("analyze");
    void streamChat(prompt, context, { openCopilot: true });
  }

  function handleContextualAsk(
    prompt: string,
    contextLabel: string,
    details?: string[]
  ) {
    handleExplainAi(prompt, contextLabel, details);
  }

  function handleHomeAsk(prompt: string) {
    handleExplainAi(prompt, "Home", roleHome ? [roleHome.personaLabel] : undefined);
  }

  function handleCopilotSubmit(trimmedInput: string) {
    return streamChat(trimmedInput, aiContext, { openCopilot: true });
  }

  function handleSuggestion(prompt: string) {
    void streamChat(prompt, aiContext, { openCopilot: true });
  }

  function handleGlobalSearch(query: string) {
    handleContextualAsk(`Search: ${query}`, "Global Search");
  }

  function handleLogout() {
    applyTenantTheme(null);
    setIsSignedIn(false);
    setCurrentUser(null);
    setCurrentWorkspace(null);
    setRoleHome(null);
    setActiveView("home");
    setMessages([]);
    setInput("");
    setCopilotOpen(false);
    setInboxOpen(false);
    setDynamicWorkspace(null);
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

  if (!currentUser || !currentWorkspace || !roleHome) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppShell
        activeView={activeView}
        user={currentUser}
        organization={currentWorkspace.organization}
        tenantTheme={currentWorkspace.theme ?? null}
        onNavigate={handleNavigate}
        onOpenInbox={() => setInboxOpen(true)}
        onLogout={handleLogout}
        onSearch={handleGlobalSearch}
        inboxCount={inboxCount}
        visibleNavItems={allowedNavItems}
        copilot={
          <AiCopilot
            user={currentUser}
            workspace={currentWorkspace}
            roleHome={roleHome}
            open={copilotOpen}
            messages={messages}
            input={input}
            isStreaming={isStreaming}
            mode={aiMode}
            onToggle={() => setCopilotOpen((current) => !current)}
            onModeChange={setAiMode}
            onInputChange={setInput}
            onSubmit={handleCopilotSubmit}
            onOpenWorkspace={handleOpenDataPage}
            onExplain={handleExplainAi}
          />
        }
      >
        {activeView === "home" ? (
          dynamicWorkspace ? (
            <DynamicWorkspace
              workspace={dynamicWorkspace}
              userName={currentUser.name}
              userRole={currentUser.role}
              onClose={() => setDynamicWorkspace(null)}
              onAskAi={(prompt, contextLabel) => handleExplainAi(prompt, contextLabel)}
              onWorkspaceChange={setDynamicWorkspace}
              onDataChange={() => void refreshLiveData()}
            />
          ) : (
            <HomeView
              user={currentUser}
              workspace={currentWorkspace}
              roleHome={roleHome}
              input={input}
              isStreaming={isStreaming}
              onInputChange={setInput}
              onAsk={handleHomeAsk}
              onOpenWorkspace={handleOpenDataPage}
            />
          )
        ) : null}

        {activeView === "workspace" ? (
          <AiWorkspaceView
            workspace={currentWorkspace}
            onOpenDataPage={handleOpenDataPage}
          />
        ) : null}

        {activeView === "knowledge" ? (
          <KnowledgeView
            workspace={currentWorkspace}
            onSearch={(query) => handleContextualAsk(query, "Knowledge")}
          />
        ) : null}

        {activeView === "workflow" ? (
          <WorkflowView
            workspaceSlug={currentWorkspace.id}
            userRole={currentUser.role}
            onAsk={(prompt) => handleContextualAsk(prompt, "Workflow")}
            onOpenWorkspace={(ws) => {
              setDynamicWorkspace(ws);
              setActiveView("home");
            }}
          />
        ) : null}

        {activeView === "profile" ? (
          <ProfileView
            workspace={currentWorkspace}
            user={currentUser}
            installedModule={installedModule}
            status={status}
          />
        ) : null}
      </AppShell>

      <NotificationsPanel
        workspaceSlug={currentWorkspace.id}
        open={inboxOpen}
        onClose={() => setInboxOpen(false)}
        onSelect={(prompt, label) => handleContextualAsk(prompt, label)}
        onOpenWorkspace={(ws) => {
          setDynamicWorkspace(ws);
          setActiveView("home");
          setInboxOpen(false);
        }}
        onCountChange={setInboxCount}
      />
    </main>
  );
}
