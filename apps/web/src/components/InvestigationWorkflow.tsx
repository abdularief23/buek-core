interface InvestigationWorkflowProps {
  steps: string[];
  activeStep: number;
}

export function InvestigationWorkflow({ steps, activeStep }: InvestigationWorkflowProps) {
  return (
    <section className="buek-section space-y-4">
      <h2 className="buek-card-title text-slate-400">Investigation Workflow</h2>
      <p className="buek-small text-slate-500">
        AI generates structured work — not just answers.
      </p>
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                index === activeStep
                  ? "bg-cyan-500 text-slate-950"
                  : index < activeStep
                    ? "bg-white/10 text-slate-400"
                    : "border border-white/10 text-slate-600"
              }`}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <span className="text-slate-600" aria-hidden="true">
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
