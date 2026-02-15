import type { AgentColorKey } from "./mock-data"

/** Tailwind text-* class for agent icon / label */
export const agentTextColor: Record<AgentColorKey, string> = {
  primary: "text-primary",
  destructive: "text-destructive",
  success: "text-success",
  warning: "text-warning",
}

/** Tailwind bg-* class with low opacity for agent icon container */
export const agentBgColor: Record<AgentColorKey, string> = {
  primary: "bg-primary/10",
  destructive: "bg-destructive/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
}
