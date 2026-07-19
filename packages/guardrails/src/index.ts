import type { DomainModule } from "@buek/shared-types";
import { isClearlyOffTopic, matchesManufacturingCapability } from "./manufacturing-capabilities.js";

export type GuardErrorCode =
  | "prompt_injection_detected"
  | "secret_detected"
  | "domain_not_supported"
  | "input_too_long"
  | "output_filtered";

export interface GuardError {
  code: GuardErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface GuardWarning {
  code: GuardErrorCode;
  message: string;
}

export interface GuardInputOptions {
  text: string;
  modules: DomainModule[];
  domainContext?: string;
  maxCharacters?: number;
  minimumDomainScore?: number;
}

export type GuardInputResult =
  | {
      allowed: true;
      detectedModule: DomainModule;
      warnings: GuardWarning[];
    }
  | {
      allowed: false;
      error: GuardError;
      statusCode: number;
    };

export interface GuardOutputOptions {
  text: string;
  toolsExecuted?: string[];
}

export interface GuardOutputResult {
  text: string;
  warnings: GuardWarning[];
}

const DEFAULT_MAX_CHARACTERS = 3000;
const DEFAULT_MINIMUM_DOMAIN_SCORE = 2;

const PROMPT_INJECTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern: /\bignore (all )?(previous|prior|above) instructions?\b/i,
    label: "ignore instructions"
  },
  {
    pattern: /\bforget (everything|all instructions|the previous instructions)\b/i,
    label: "forget instructions"
  },
  { pattern: /\breveal (the )?(system|developer|hidden) prompt\b/i, label: "reveal prompt" },
  { pattern: /\bshow (the )?(system|developer|hidden) prompt\b/i, label: "show prompt" },
  { pattern: /\b(system prompt|developer message|hidden prompt)\b/i, label: "prompt disclosure" },
  { pattern: /\bact as (dan|developer mode|jailbroken)\b/i, label: "jailbreak persona" },
  { pattern: /\bjailbreak\b/i, label: "jailbreak" }
];

const SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bOPENAI_API_KEY\b/i, label: "OPENAI_API_KEY" },
  { pattern: /\bDATABASE_URL\b/i, label: "DATABASE_URL" },
  { pattern: /\bJWT_SECRET\b/i, label: "JWT_SECRET" },
  {
    pattern: /\b(API[\s_-]?KEY|ACCESS[\s_-]?TOKEN|AUTH[\s_-]?TOKEN)\b/i,
    label: "token or API key"
  },
  { pattern: /\bPASSWORD\b/i, label: "password" },
  { pattern: /\bsk-[A-Za-z0-9_*.-]{8,}\b/, label: "OpenAI-style secret" },
  { pattern: /\bpostgres(?:ql)?:\/\/[^\s]+/i, label: "database URL" }
];

const FAKE_TOOL_EXECUTION_PATTERN =
  /\b(i\s+(deleted|updated|created|modified|wrote|sent|accessed|changed)|done)\b[\s\S]{0,120}\b(database|filesystem|erp|mes|file|record|system)\b/i;

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2)
    )
  );
}

function moduleSearchText(module: DomainModule): string {
  return [
    module.name,
    module.description,
    module.capabilities.join(" "),
    module.prompts
      .map((prompt) => [prompt.name, prompt.description, prompt.template].join(" "))
      .join(" "),
    module.tools.map((tool) => [tool.name, tool.description, tool.id].join(" ")).join(" "),
    module.workflows
      .map((workflow) => [workflow.name, workflow.description, workflow.steps.join(" ")].join(" "))
      .join(" ")
  ]
    .join(" ")
    .toLowerCase();
}

function moduleScope(module: DomainModule): string {
  return Array.from(
    new Set(
      [
        module.name,
        ...module.capabilities.map((capability) => capability.replaceAll("-", " "))
      ].filter(Boolean)
    )
  )
    .slice(0, 12)
    .join(", ");
}

function scoreModule(module: DomainModule, text: string, domainContext = ""): number {
  const searchText = `${moduleSearchText(module)} ${domainContext}`.toLowerCase();
  const queryTokens = tokenize(text);
  let score = 0;

  for (const token of queryTokens) {
    if (searchText.includes(token)) {
      score += token.length > 5 ? 2 : 1;
    }
  }

  for (const capability of module.capabilities) {
    const normalized = capability.replaceAll("-", " ").toLowerCase();

    if (text.toLowerCase().includes(normalized)) {
      score += 4;
    }
  }

  return score;
}

function detectBestModule(
  modules: DomainModule[],
  text: string,
  domainContext = ""
): { module: DomainModule; score: number } | undefined {
  return modules
    .map((module) => ({ module, score: scoreModule(module, text, domainContext) }))
    .sort((left, right) => right.score - left.score)[0];
}

function createScopeMessage(_modules: DomainModule[]): string {
  return "Topik ini di luar domain Manufacturing Module. Saya dapat membantu SOP, KPI, PPM, OEE, quality, maintenance, work order, engineering report, customer complaint, dan proses produksi lainnya.";
}

export function guardInput(options: GuardInputOptions): GuardInputResult {
  const maxCharacters = options.maxCharacters ?? DEFAULT_MAX_CHARACTERS;
  const minimumDomainScore = options.minimumDomainScore ?? DEFAULT_MINIMUM_DOMAIN_SCORE;
  const text = options.text.trim();

  if (text.length > maxCharacters) {
    return {
      allowed: false,
      statusCode: 413,
      error: {
        code: "input_too_long",
        message: `Input is too long. Maximum length is ${maxCharacters} characters.`,
        details: { maxCharacters, actualCharacters: text.length }
      }
    };
  }

  for (const { pattern, label } of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        statusCode: 400,
        error: {
          code: "prompt_injection_detected",
          message: "Prompt injection detected.",
          details: { pattern: label }
        }
      };
    }
  }

  for (const { pattern, label } of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        statusCode: 400,
        error: {
          code: "secret_detected",
          message:
            "Secret-like input detected. Remove keys, tokens, passwords, or connection strings.",
          details: { pattern: label }
        }
      };
    }
  }

  const bestModule = detectBestModule(options.modules, text, options.domainContext);
  const hasManufacturingModule = options.modules.some((m) => m.id === "manufacturing");

  if (isClearlyOffTopic(text)) {
    return {
      allowed: false,
      statusCode: 400,
      error: {
        code: "domain_not_supported",
        message: createScopeMessage(options.modules),
        details: { reason: "off_topic" }
      }
    };
  }

  if (hasManufacturingModule && matchesManufacturingCapability(text)) {
    const manufacturingModule = options.modules.find((m) => m.id === "manufacturing") ?? options.modules[0]!;
    return {
      allowed: true,
      detectedModule: manufacturingModule,
      warnings: []
    };
  }

  if (!bestModule || bestModule.score < minimumDomainScore) {
    return {
      allowed: false,
      statusCode: 400,
      error: {
        code: "domain_not_supported",
        message: createScopeMessage(options.modules),
        details: {
          installedModules: options.modules.map((module) => module.name)
        }
      }
    };
  }

  return {
    allowed: true,
    detectedModule: bestModule.module,
    warnings: []
  };
}

function filterSensitiveText(text: string): { text: string; warnings: GuardWarning[] } {
  let filtered = text;
  const warnings: GuardWarning[] = [];

  for (const { pattern, label } of SECRET_PATTERNS) {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, "[REDACTED]");
      warnings.push({
        code: "output_filtered",
        message: `Sensitive output filtered: ${label}.`
      });
    }
  }

  return { text: filtered, warnings };
}

export function guardOutput(options: GuardOutputOptions): GuardOutputResult {
  const filtered = filterSensitiveText(options.text);
  const warnings = [...filtered.warnings];
  let text = filtered.text;

  if (!options.toolsExecuted?.length && FAKE_TOOL_EXECUTION_PATTERN.test(text)) {
    text = "I could not access the requested system.";
    warnings.push({
      code: "output_filtered",
      message: "Potential fake tool execution claim was replaced."
    });
  }

  return { text, warnings };
}
