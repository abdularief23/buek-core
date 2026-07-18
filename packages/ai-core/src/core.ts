import type { DomainModule, RegistrySnapshot } from "@buek/shared-types";
import { DomainModuleRegistry } from "./registry.js";

export interface BuekCoreOptions {
  defaultModel: string;
}

export class BuekCore {
  readonly registry = new DomainModuleRegistry();

  constructor(private readonly options: BuekCoreOptions) {}

  registerDomainModule(module: DomainModule): void {
    this.registry.register(module);
  }

  getDefaultModel(): string {
    return this.options.defaultModel;
  }

  getRegistrySnapshot(): RegistrySnapshot {
    return this.registry.snapshot();
  }
}
