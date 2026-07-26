import { runAllShiftMonitors } from "./shift-monitor.js";

const HEARTBEAT_INTERVAL_MS = 4 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 45_000;

let schedulerStarted = false;

export function startAgentScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  setTimeout(() => {
    void runAllShiftMonitors().catch(() => undefined);
  }, INITIAL_DELAY_MS);

  setInterval(() => {
    void runAllShiftMonitors().catch(() => undefined);
  }, HEARTBEAT_INTERVAL_MS);
}
