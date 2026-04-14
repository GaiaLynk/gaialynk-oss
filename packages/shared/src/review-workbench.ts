/**
 * E-46: 审核工作台 — 策略版本与复检基线类型（与审计 payload / API 对齐）。
 * 字段或 diff 语义变更时请递增版本号。
 */
export const REVIEW_WORKBENCH_POLICY_VERSION = "v161.1-e48-1";

export const AGENT_REVIEW_AUDIT_EVENT_TYPES = [
  "agent.review.submitted",
  "agent.review.approved",
  "agent.review.rejected",
  "agent.review.changes_requested",
] as const;

export type AgentReviewAuditEventType = (typeof AGENT_REVIEW_AUDIT_EVENT_TYPES)[number];

/** 创始人退回修改时写入的复检前快照（供 Provider 再次提交后与当前态做 diff）。 */
export type ReviewRecheckBaselineV1 = {
  v: 1;
  recorded_at: string;
  failed_check_ids: string[];
  capabilities_signature: string;
  a2a_interface_fingerprint: string | null;
};

export type ReviewRecheckDiff = {
  failed_checks_resolved: string[];
  failed_checks_new: string[];
  capabilities_changed: boolean;
  a2a_interface_fingerprint_changed: boolean;
};

export type FailedCheckDetailItem = {
  id: string;
  detail?: string;
};
