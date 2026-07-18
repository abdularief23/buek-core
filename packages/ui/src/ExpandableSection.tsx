import { type PropsWithChildren, useId, useState } from "react";

export interface ExpandableSectionProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  defaultOpen?: boolean;
  level?: 0 | 1 | 2;
  className?: string;
}

export function ExpandableSection({
  title,
  subtitle,
  leading,
  defaultOpen = false,
  level = 0,
  className = "",
  children
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  const indent = level === 1 ? "ml-3 border-l border-white/10 pl-3" : level === 2 ? "ml-6 border-l border-white/5 pl-3" : "";

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] ${indent} ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
      >
        {leading ? <span className="shrink-0">{leading}</span> : null}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-slate-100">{title}</span>
          {subtitle ? <span className="mt-0.5 block text-xs text-slate-400">{subtitle}</span> : null}
        </span>
        <span className="shrink-0 text-xs text-slate-500">{open ? "▲" : "▼"}</span>
      </button>
      {open && children ? (
        <div id={contentId} className="border-t border-white/5 px-4 py-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
