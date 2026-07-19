import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function Button({ children, className = "", ...props }: ButtonProps) {
  const hasCustomColors = /\b(?:bg-|text-)/.test(className);
  const defaults = hasCustomColors
    ? "rounded-lg px-4 py-2 text-sm font-semibold transition"
    : "rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800";

  return (
    <button className={`${defaults} ${className}`} {...props}>
      {children}
    </button>
  );
}
