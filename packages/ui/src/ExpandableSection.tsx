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
    <div className={`${indent} ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 py-2 text-left text-sm text-slate-400 transition hover:text-slate-200"
      >
        <span className="shrink-0 text-xs">{open ? "▲" : "▼"}</span>
        {leading ? <span className="shrink-0">{leading}</span> : null}
        <span className="min-w-0 flex-1">
          <span className="text-slate-300">{title}</span>
          {subtitle ? <span className="ml-2 text-slate-500">{subtitle}</span> : null}
        </span>
      </button>
      {open && children ? (
        <div id={contentId} className="pb-2 pl-5">
          {children}
        </div>
      ) : null}
    </div>
  );
}
