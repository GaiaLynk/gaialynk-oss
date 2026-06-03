/**
 * E-1764-A (V1.7.6.4): Provider 注册预检分级结构 — 前后端共享契约。
 */

export const PROVIDER_GATING_ENGINE_VERSION = "1.0.0" as const;

export type ProviderGatingSeverity = "blocking" | "warning" | "pass";

export interface ProviderGatingCheck {
  severity: ProviderGatingSeverity;
  reason_code: string;
  remediation_hint: string;
  doc_anchor: string;
}

export interface ProviderGatingResult {
  engine_version: typeof PROVIDER_GATING_ENGINE_VERSION;
  /** Feature `A2A_V1764_GATE_BLOCKING_RULE_ENABLED` 是否参与判定 */
  gate_enabled: boolean;
  checks: ProviderGatingCheck[];
  has_blocking: boolean;
  /** 无 blocking 项时可提交审核（软约束不阻断） */
  can_submit_for_review: boolean;
}

/** E-1764-A 硬约束：SendMessage 非 Task-only */
export const PROVIDER_GATING_REASON_SENDMESSAGE_TASK_NONCOMPLIANT =
  "provider_gating_sendmessage_task_noncompliant" as const;

/** E-1764-A 硬约束：异步/长任务场景缺失 CancelTask */
export const PROVIDER_GATING_REASON_CANCEL_TASK_REQUIRED =
  "provider_gating_cancel_task_required" as const;

/** E-1764-A 软约束：未声明 Extended Agent Card */
export const PROVIDER_GATING_REASON_EXTENDED_CARD_MISSING =
  "provider_gating_extended_card_missing" as const;

/** E-1764-A 软约束：Extended Agent Card 拉取失败 */
export const PROVIDER_GATING_REASON_EXTENDED_CARD_FETCH_FAILED =
  "provider_gating_extended_card_fetch_failed" as const;

/** E-1764-A 软约束：Rich Part 能力未验证 */
export const PROVIDER_GATING_REASON_RICH_PART_MISSING =
  "provider_gating_rich_part_missing" as const;

export function buildProviderGatingResult(input: {
  gateEnabled: boolean;
  checks: ProviderGatingCheck[];
}): ProviderGatingResult {
  const has_blocking = input.gateEnabled && input.checks.some((c) => c.severity === "blocking");
  return {
    engine_version: PROVIDER_GATING_ENGINE_VERSION,
    gate_enabled: input.gateEnabled,
    checks: input.checks,
    has_blocking,
    can_submit_for_review: !has_blocking,
  };
}
