import type { FormEvent } from "react";

export interface AiPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
}

export function AiPromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = "What can I help you with today?",
  disabled = false,
  autoFocus = false,
  id = "ai-prompt"
}: AiPromptInputProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3.5 pr-20 text-base text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/30 disabled:opacity-60"
      />
      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          aria-label="Voice input"
          className="rounded-lg px-2 py-1 text-base text-slate-500 hover:text-slate-300 disabled:opacity-40"
        >
          🎤
        </button>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send"
          className="rounded-lg px-2 py-1 text-cyan-400 hover:text-cyan-300 disabled:opacity-40"
        >
          →
        </button>
      </div>
    </form>
  );
}
