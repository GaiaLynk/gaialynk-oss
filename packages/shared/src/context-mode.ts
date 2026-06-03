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

/** E-1764-B (V1.7.6.4): 注册 API 稳定错误码 — `context_mode` 未显式传入 */
export const CONTEXT_MODE_REQUIRED_ERROR_CODE = "context_mode_required" as const;

/** E-1764-B: `provider_managed` 须带确认标记 `provider_managed_confirmed=true` */
export const PROVIDER_MANAGED_CONFIRMATION_REQUIRED_ERROR_CODE =
  "provider_managed_confirmation_required" as const;

export interface RegisterContextModeBody {
  context_mode?: AgentContextMode;
  provider_managed_confirmed?: boolean;
}

export type RegisterContextModeValidationErrorCode =
  | typeof CONTEXT_MODE_REQUIRED_ERROR_CODE
  | typeof PROVIDER_MANAGED_CONFIRMATION_REQUIRED_ERROR_CODE;

export function validateRegisterContextModeContract(
  input: RegisterContextModeBody,
  options: { explicitRequired: boolean },
):
  | { ok: true; context_mode: AgentContextMode }
  | { ok: false; code: RegisterContextModeValidationErrorCode; message: string } {
  if (!options.explicitRequired) {
    return { ok: true, context_mode: normalizeAgentContextMode(input.context_mode) };
  }

  if (input.context_mode === undefined) {
    return {
      ok: false,
      code: CONTEXT_MODE_REQUIRED_ERROR_CODE,
      message: "context_mode is required (platform_managed or provider_managed)",
    };
  }

  if (input.context_mode === "provider_managed" && input.provider_managed_confirmed !== true) {
    return {
      ok: false,
      code: PROVIDER_MANAGED_CONFIRMATION_REQUIRED_ERROR_CODE,
      message:
        "provider_managed requires explicit confirmation (provider_managed_confirmed=true)",
    };
  }

  return { ok: true, context_mode: input.context_mode };
}
