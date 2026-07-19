export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Loading...", className = "" }: LoadingStateProps) {
  return (
    <div className={`flex items-center gap-3 text-slate-400 ${className}`}>
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[var(--tenant-accent,#22d3ee)]"
        role="status"
        aria-label="Loading"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
