export type ConnectorType = "demo-database" | "mes" | "erp" | "cmms" | "scada";

export interface OperationalMachine {
  code: string;
  name: string;
  status: string;
  downtimeMinutes?: number;
}

export interface OperationalAlarm {
  id: string;
  message: string;
  severity: string;
  machineCode?: string;
}

export interface OperationalSnapshot {
  source: ConnectorType;
  readOnly: true;
  fetchedAt: string;
  metrics: Record<string, number>;
  machines: OperationalMachine[];
  alarms: OperationalAlarm[];
}

export interface ConnectorInfo {
  id: string;
  type: ConnectorType;
  label: string;
  description: string;
  status: "connected" | "disconnected" | "demo";
  readOnly: true;
  lastSync?: string;
}

export interface OperationalConnector {
  info: ConnectorInfo;
  fetchSnapshot(workspaceSlug: string): Promise<OperationalSnapshot>;
}
