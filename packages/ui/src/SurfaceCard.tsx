import type { PropsWithChildren } from "react";

export interface SurfaceCardProps extends PropsWithChildren {
  title?: string;
  className?: string;
}

export function SurfaceCard({ title, className = "", children }: SurfaceCardProps) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      {title ? <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3> : null}
      {children}
    </section>
  );
}
