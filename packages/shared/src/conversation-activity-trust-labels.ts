/**
 * User-visible labels for trust / boundary rows in the chat right-rail「最近活动」list.
 * Aligns with ADR-0012 schemes 2–5 (intent, posture, redline deny, data boundary, yellow-line allow_limited).
 */
import type { ActionStatusLocaleBundle } from "./types/action-status";

const L = (en: string, zhHans: string, zhHant: string): ActionStatusLocaleBundle => ({ en, zhHans, zhHant });

export const TRUST_SAFETY_AUDIT_EVENT_TYPES = [
  "invocation.allowed_limited",
  "invocation.need_confirmation",
  "invocation.pending_confirmation",
  "invocation.denied",
  "invocation.confirmed",
  "invocation.denied_by_reviewer",
  "boundary.denied",
] as const;

export type TrustSafetyAuditEventType = (typeof TRUST_SAFETY_AUDIT_EVENT_TYPES)[number];

const POSTURE_REASON_CODES = new Set([
  "agent_posture_reputation_floor",
  "agent_posture_hub_not_ready",
  "agent_posture_card_security_failed",
]);

export type TrustActivityLabelInput = {
  event_type: string;
  reason_codes?: string[];
  trust_decision?: {
    decision?: string;
    reason_codes?: string[];
  };
};

function mergedReasonCodes(input: TrustActivityLabelInput): string[] {
  const fromTrust = input.trust_decision?.reason_codes ?? [];
  const fromPayload = input.reason_codes ?? [];
  return [...new Set([...fromTrust, ...fromPayload].filter(Boolean))];
}

/** Human label for a trust/boundary audit event (no raw reason_code strings). */
export function labelTrustSafetyAuditActivity(input: TrustActivityLabelInput): ActionStatusLocaleBundle {
  const codes = mergedReasonCodes(input);
  const decision = input.trust_decision?.decision;
  const eventType = input.event_type;

  if (eventType === "boundary.denied") {
    return L(
      "Data boundary blocked this message",
      "数据边界拦截（消息未发送）",
      "資料邊界攔截（訊息未傳送）",
    );
  }

  if (eventType === "invocation.allowed_limited" || decision === "allow_limited") {
    if (codes.includes("action_yellow_line_audited")) {
      return L(
        "Yellow-line: allowed with audit (no confirmation)",
        "黄线受限放行（已审计，无需确认）",
        "黃線受限放行（已稽核，無需確認）",
      );
    }
    return L(
      "Allowed with limits (recorded in audit)",
      "受限放行（已记入审计）",
      "受限放行（已記入稽核）",
    );
  }

  if (eventType === "invocation.confirmed") {
    return L(
      "You confirmed; execution continued",
      "你已确认并继续执行",
      "你已確認並繼續執行",
    );
  }

  if (eventType === "invocation.denied_by_reviewer") {
    return L(
      "Reviewer declined this invocation",
      "审核人已拒绝本次调用",
      "審核人已拒絕本次呼叫",
    );
  }

  if (eventType === "invocation.denied" || decision === "deny") {
    if (
      codes.some(
        (c) =>
          c.startsWith("platform_redline") ||
          c === "prompt_injection_ignore_previous" ||
          c === "sensitive_data_exfiltration_attempt",
      )
    ) {
      return L(
        "Redline policy blocked this action",
        "红线策略拒绝",
        "紅線策略拒絕",
      );
    }
    return L(
      "Platform policy blocked this action",
      "平台策略拒绝",
      "平台策略拒絕",
    );
  }

  if (eventType === "invocation.pending_confirmation") {
    return L(
      "Waiting for your confirmation",
      "等待你确认后继续",
      "等待你確認後繼續",
    );
  }

  if (eventType === "invocation.need_confirmation" || decision === "need_confirmation") {
    if (codes.some((c) => POSTURE_REASON_CODES.has(c))) {
      return L(
        "Agent posture: confirmation required",
        "Agent 姿态审慎：待你确认",
        "Agent 姿態審慎：待你確認",
      );
    }
    if (codes.includes("action_intent_elevated_risk")) {
      return L(
        "Intent risk elevated: confirmation required",
        "用户意图风险上调：待你确认",
        "用戶意圖風險上調：待你確認",
      );
    }
    return L(
      "Trust policy: confirmation required",
      "信任策略：待你确认",
      "信任策略：待你確認",
    );
  }

  return L(
    `Safety activity (${eventType})`,
    `安全活动（${eventType}）`,
    `安全活動（${eventType}）`,
  );
}

/** Receipt row when invocation completed under allow_limited / yellow-line. */
export function labelInvocationCompletedReceipt(
  trustDecision: TrustActivityLabelInput["trust_decision"] | undefined,
  defaultLabel: ActionStatusLocaleBundle,
): ActionStatusLocaleBundle {
  if (trustDecision?.decision !== "allow_limited") {
    return defaultLabel;
  }
  const codes = trustDecision.reason_codes ?? [];
  if (codes.includes("action_yellow_line_audited")) {
    return L(
      "Yellow-line run completed (audited)",
      "黄线受限放行：执行完成",
      "黃線受限放行：執行完成",
    );
  }
  return L(
    "Limited-allow run completed (audited)",
    "受限放行：执行完成",
    "受限放行：執行完成",
  );
}
