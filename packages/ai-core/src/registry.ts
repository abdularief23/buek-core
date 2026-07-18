import type { DomainModule, RegistrySnapshot } from "@buek/shared-types";

export class DomainModuleRegistry {
  private readonly modules = new Map<string, DomainModule>();

  register(module: DomainModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Domain module "${module.id}" is already registered.`);
    }

    this.modules.set(module.id, module);
  }

  list(): DomainModule[] {
    return Array.from(this.modules.values());
  }

  find(moduleId: string): DomainModule | undefined {
    return this.modules.get(moduleId);
  }

  snapshot(): RegistrySnapshot {
    return {
      modules: this.list().map((module) => ({
        id: module.id,
        name: module.name,
        version: module.version,
        capabilities: module.capabilities
      }))
    };
  }
}
