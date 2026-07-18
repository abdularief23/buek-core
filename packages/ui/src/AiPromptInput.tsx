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
        className="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-5 py-4 pr-14 text-base text-white placeholder-slate-500 outline-none ring-cyan-300/50 transition focus:border-cyan-300/30 focus:ring-2 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send prompt"
        className="absolute inset-y-0 right-3 flex items-center rounded-xl px-2 text-lg text-cyan-300 transition hover:text-cyan-200 disabled:opacity-40"
      >
        →
      </button>
    </form>
  );
}
