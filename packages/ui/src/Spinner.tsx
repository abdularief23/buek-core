export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]"
} as const;

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-white/20 border-t-[var(--tenant-accent,#22d3ee)] ${sizeClass[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
