export interface MemoryRecord {
  id: string;
  scope: string;
  value: string;
  createdAt: Date;
}

export class InMemoryStore {
  private readonly records = new Map<string, MemoryRecord>();

  put(record: MemoryRecord): void {
    this.records.set(record.id, record);
  }

  list(scope?: string): MemoryRecord[] {
    const records = Array.from(this.records.values());

    if (!scope) {
      return records;
    }

    return records.filter((record) => record.scope === scope);
  }
}
