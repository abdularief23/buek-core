import { useEffect, useRef, useState } from "react";
import {
  type AppearanceMode,
  type AppLanguage,
  getAppearanceMode,
  LANGUAGE_LABELS,
  setAppearanceMode
} from "../lib/user-preferences.js";
import { useLanguage } from "../lib/language-context.js";

const APPEARANCE_OPTIONS: Array<{ value: AppearanceMode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" }
];

const LANGUAGE_OPTIONS: Array<{ value: AppLanguage; label: string }> = [
  { value: "id", label: "Indonesia" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" }
];

export function PreferencesMenu({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [appearance, setAppearance] = useState<AppearanceMode>(getAppearanceMode());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const appearanceLabel = APPEARANCE_OPTIONS.find((o) => o.value === appearance)?.label ?? "Theme";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pref-menu-trigger flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span aria-hidden>⚙️</span>
        {compact ? null : (
          <span>
            {appearanceLabel} · {LANGUAGE_LABELS[language]}
          </span>
        )}
        <span className="text-xs text-slate-500">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="pref-menu-dropdown absolute right-0 z-50 mt-2 w-64 rounded-xl border border-white/10 bg-slate-900 p-4 shadow-xl">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{t("prefs.appearance")}</p>
          <div className="space-y-1">
            {APPEARANCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setAppearance(option.value);
                  setAppearanceMode(option.value);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  appearance === option.value
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {option.label}
                {appearance === option.value ? <span>✓</span> : null}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">{t("prefs.language")}</p>
          <div className="space-y-1">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLanguage(option.value)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  language === option.value
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {option.label}
                {language === option.value ? <span>✓</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
