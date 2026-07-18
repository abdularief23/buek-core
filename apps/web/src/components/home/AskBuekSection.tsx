import { AiPromptInput } from "@buek/ui";

interface AskBuekSectionProps {
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onAsk: (prompt: string) => void;
  helpTopics?: string[];
}

export function AskBuekSection({
  input,
  isStreaming,
  onInputChange,
  onAsk,
  helpTopics
}: AskBuekSectionProps) {
  async function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onInputChange("");
    onAsk(trimmed);
  }

  return (
    <section className="buek-section space-y-6 border-t border-white/10 pt-12">
      <div>
        <h2 className="buek-card-title text-slate-300">Need Help?</h2>
        {helpTopics?.length ? (
          <p className="mt-2 buek-small text-slate-500">
            AI helps with: {helpTopics.join(" · ")}
          </p>
        ) : null}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <AiPromptInput
          value={input}
          onChange={onInputChange}
          onSubmit={handleSubmit}
          disabled={isStreaming}
          placeholder="Ask Buek..."
          id="home-ask-buek"
        />
      </div>
    </section>
  );
}
