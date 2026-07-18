import type { DomainModule } from "@buek/shared-types";

export interface ModuleDiscoveryOptions {
  moduleNames?: string[];
  env?: NodeJS.ProcessEnv;
}

export interface ModuleDiscoveryResult {
  modules: DomainModule[];
  errors: Array<{
    moduleName: string;
    reason: string;
  }>;
}

const DEFAULT_DOMAIN_MODULES = ["@buek/domain-manufacturing"];

function resolveModuleNames(options: ModuleDiscoveryOptions): string[] {
  if (options.moduleNames?.length) {
    return options.moduleNames;
  }

  const configuredModules = options.env?.BUEK_DOMAIN_MODULES;

  if (!configuredModules) {
    return DEFAULT_DOMAIN_MODULES;
  }

  return configuredModules
    .split(",")
    .map((moduleName) => moduleName.trim())
    .filter(Boolean);
}

function isDomainModule(value: unknown): value is DomainModule {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DomainModule>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.version === "string" &&
    Array.isArray(candidate.capabilities) &&
    Array.isArray(candidate.knowledge) &&
    Array.isArray(candidate.tools) &&
    Array.isArray(candidate.prompts) &&
    Array.isArray(candidate.workflows) &&
    Array.isArray(candidate.agents)
  );
}

export async function discoverInstalledDomainModules(
  options: ModuleDiscoveryOptions = {}
): Promise<ModuleDiscoveryResult> {
  const modules: DomainModule[] = [];
  const errors: ModuleDiscoveryResult["errors"] = [];

  for (const moduleName of resolveModuleNames(options)) {
    try {
      const importedModule = (await import(moduleName)) as Record<string, unknown>;
      const candidate = importedModule.domainModule ?? importedModule.default;

      if (!isDomainModule(candidate)) {
        errors.push({
          moduleName,
          reason: "Package did not export a valid DomainModule."
        });
        continue;
      }

      modules.push(candidate);
    } catch (error) {
      errors.push({
        moduleName,
        reason: error instanceof Error ? error.message : "Unknown module discovery error."
      });
    }
  }

  return { modules, errors };
}
