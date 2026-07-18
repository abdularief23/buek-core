import type { DemoUser, RoleHomeData, Workspace } from "../types.js";
import { EngineerHome } from "./home/EngineerHome.js";
import { ManagerHome } from "./home/ManagerHome.js";
import { OperatorHome } from "./home/OperatorHome.js";
import type { RoleHomeProps } from "./home/shared.js";
import { SupervisorHome } from "./home/SupervisorHome.js";

interface HomeViewProps {
  user: DemoUser;
  workspace: Workspace;
  roleHome: RoleHomeData;
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onAsk: (prompt: string) => void;
  onAction: (prompt: string, contextLabel: string) => void;
}

export function HomeView(props: HomeViewProps) {
  const shared: RoleHomeProps = props;

  switch (props.roleHome.roleKey) {
    case "operator":
      return <OperatorHome {...shared} />;
    case "supervisor":
      return <SupervisorHome {...shared} />;
    case "manager":
      return <ManagerHome {...shared} />;
    default:
      return <EngineerHome {...shared} />;
  }
}
