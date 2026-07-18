import { BuekCore } from "@buek/ai-core";
import type { DomainModule, RegistrySnapshot } from "@buek/shared-types";

export class AgentPlatform {
  constructor(private readonly core: BuekCore) {}

  installDomainModules(modules: DomainModule[]): void {
    for (const module of modules) {
      this.core.registerDomainModule(module);
    }
  }

  getRegistrySnapshot(): RegistrySnapshot {
    return this.core.getRegistrySnapshot();
  }
}
