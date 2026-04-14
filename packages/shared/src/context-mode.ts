/**
 * E-55 / OPT-005: Agent `context_mode` — who owns multi-turn conversation context for A2A.
 */
export type AgentContextMode = "platform_managed" | "provider_managed";

export const AGENT_CONTEXT_MODE_DEFAULT: AgentContextMode = "platform_managed";

export function parseAgentContextMode(raw: unknown): AgentContextMode | undefined {
  if (raw === "platform_managed" || raw === "provider_managed") return raw;
  return undefined;
}

export function normalizeAgentContextMode(raw: unknown | undefined): AgentContextMode {
  return parseAgentContextMode(raw) ?? AGENT_CONTEXT_MODE_DEFAULT;
}
