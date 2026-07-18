import type { Workspace } from "../types.js";

interface ExamplePromptsProps {
  workspace: Workspace;
  onSelect: (prompt: string) => void;
}

export function ExamplePrompts({ workspace, onSelect }: ExamplePromptsProps) {
  if (!workspace.examplePrompts.length) return null;

  return (
    <section>
      <h2 className="text-xs font-medium tracking-wide text-slate-500">Examples</h2>
      <ul className="mt-3 space-y-1">
        {workspace.examplePrompts.map((example) => (
          <li key={example.label}>
            <button
              type="button"
              onClick={() => onSelect(example.prompt)}
              className="flex w-full items-center gap-2 py-1.5 text-left text-sm text-slate-400 transition hover:text-slate-200"
            >
              <span>{example.icon}</span>
              <span>{example.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
