export type AppearanceMode = "dark" | "light" | "system";
export type AppLanguage = "id" | "en" | "ja";

const APPEARANCE_KEY = "buek-appearance";
const LANGUAGE_KEY = "buek-language";

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  id: "Bahasa Indonesia",
  en: "English",
  ja: "日本語"
};

export function getAppearanceMode(): AppearanceMode {
  const stored = localStorage.getItem(APPEARANCE_KEY);
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return "dark";
}

export function setAppearanceMode(mode: AppearanceMode): void {
  localStorage.setItem(APPEARANCE_KEY, mode);
  applyAppearanceMode(mode);
}

export function getAppLanguage(): AppLanguage {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored === "id" || stored === "en" || stored === "ja") return stored;
  return "id";
}

export function setAppLanguage(language: AppLanguage): void {
  localStorage.setItem(LANGUAGE_KEY, language);
}

export function resolveAppearance(mode: AppearanceMode): "dark" | "light" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export function applyAppearanceMode(mode: AppearanceMode = getAppearanceMode()): void {
  const resolved = resolveAppearance(mode);
  document.documentElement.dataset.appearance = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function initUserPreferences(): void {
  applyAppearanceMode();
  if (getAppearanceMode() === "system") {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      applyAppearanceMode("system");
    });
  }
}

export function languageInstruction(language: AppLanguage): string {
  if (language === "id") return "Jawab selalu dalam Bahasa Indonesia yang profesional.";
  if (language === "ja") return "常に丁寧な日本語で回答してください。";
  return "Always respond in professional English.";
}
