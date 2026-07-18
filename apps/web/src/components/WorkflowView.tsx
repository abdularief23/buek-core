interface WorkflowViewProps {
  onAsk: (prompt: string) => void;
}

const workflows = [
  {
    id: "wf-1",
    title: "White Streak Investigation",
    status: "In Progress",
    prompt: "Continue white streak investigation workflow"
  },
  {
    id: "wf-2",
    title: "Machine Alarm Response",
    status: "Active",
    prompt: "Show machine alarm response workflow steps"
  },
  {
    id: "wf-3",
    title: "Daily Production Review",
    status: "Scheduled",
    prompt: "Start daily production review workflow"
  }
];

export function WorkflowView({ onAsk }: WorkflowViewProps) {
  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-white">Workflow</h1>
        <p className="mt-2 text-base text-slate-400">
          Guided processes powered by AI — Understand, Observe, Reason, Recommend, Act.
        </p>
      </header>

      <ul className="space-y-3">
        {workflows.map((workflow) => (
          <li key={workflow.id}>
            <button
              type="button"
              onClick={() => onAsk(workflow.prompt)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 px-6 py-5 text-left transition hover:border-cyan-400/30"
            >
              <div>
                <p className="text-base font-medium text-white">{workflow.title}</p>
                <p className="mt-1 text-sm text-slate-500">{workflow.status}</p>
              </div>
              <span className="text-cyan-400">→</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
