import { demoDatabaseConnector } from "./demo-database.js";
import type { ConnectorInfo, OperationalConnector, OperationalSnapshot } from "./types.js";

const connectors: OperationalConnector[] = [demoDatabaseConnector];

export type { ConnectorInfo, OperationalConnector, OperationalSnapshot } from "./types.js";

export function listConnectors(): ConnectorInfo[] {
  return connectors.map((c) => c.info);
}

export async function fetchOperationalSnapshot(workspaceSlug: string): Promise<OperationalSnapshot> {
  const connector = connectors[0];
  if (!connector) {
    throw new Error("No operational connector configured.");
  }
  return connector.fetchSnapshot(workspaceSlug);
}
