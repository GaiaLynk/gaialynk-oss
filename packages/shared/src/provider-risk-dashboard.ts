/**
 * E-1764-C (V1.7.6.4): Provider「我的 Agent」运维风险首页聚合契约。
 */
import type { ProviderGatingCheck, ProviderGatingSeverity } from "./provider-gating";

export const PROVIDER_RISK_DASHBOARD_VERSION = "1.0.0" as const;

export type ProviderRiskPriority = "P0" | "P1" | "P2";

export const PROVIDER_RISK_PRIORITY_ORDER: Record<ProviderRiskPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
};

export type ProviderRiskFixEntryKind =
  | "health_check"
  | "registration_gating"
  | "protocol_governance"
  | "doc";

export interface ProviderRiskFixEntry {
  kind: ProviderRiskFixEntryKind;
  /** 主线 API 路径（agent id 已填入） */
  api_path?: string;
  /** 官网控制台路由（供 W-1764-B 一跳） */
  portal_path?: string;
  doc_anchor?: string;
  label: string;
}

export interface ProviderRiskQueueItem {
  agent_id: string;
  agent_name: string;
  priority: ProviderRiskPriority;
  severity: Exclude<ProviderGatingSeverity, "pass">;
  reason_code: string;
  remediation_hint: string;
  doc_anchor: string;
  impact_scope: "onboarding" | "health" | "governance" | "runtime" | "enhancement";
  fix_entry: ProviderRiskFixEntry;
}

export interface ProviderRiskAgentSummary {
  agent_id: string;
  agent_name: string;
  agent_status?: string;
  listing_status?: string;
  health_check_status?: string | null;
  health_check_at?: string | null;
  priority: ProviderRiskPriority | null;
  blocking_count: number;
  warning_count: number;
  risks: ProviderRiskQueueItem[];
}

export interface ProviderRiskMetrics24h {
  window_hours: number;
  invocation_total: number;
  invocation_completed: number;
  invocation_failed: number;
  invocation_timeout: number;
  /** 0–1，无调用时为 0 */
  failure_rate: number;
  /** 0–1，无调用时为 0 */
  timeout_rate: number;
}

export interface ProviderRiskHealthOverview {
  total_agents: number;
  healthy_count: number;
  degraded_count: number;
  unknown_count: number;
}

export interface ProviderRiskBlockingCounts {
  p0: number;
  p1: number;
  p2: number;
  total_blocking: number;
  total_warning: number;
}

export interface ProviderRiskDashboard {
  dashboard_version: typeof PROVIDER_RISK_DASHBOARD_VERSION;
  generated_at: string;
  health_overview: ProviderRiskHealthOverview;
  metrics_24h: ProviderRiskMetrics24h;
  blocking_risk_counts: ProviderRiskBlockingCounts;
  /** 按 P0→P1→P2、agent 名排序的扁平待办队列 */
  risk_queue: ProviderRiskQueueItem[];
  /** 至少有一项非 pass 风险的 Agent */
  agents_needing_fix: ProviderRiskAgentSummary[];
}

export function compareProviderRiskPriority(a: ProviderRiskPriority, b: ProviderRiskPriority): number {
  return PROVIDER_RISK_PRIORITY_ORDER[a] - PROVIDER_RISK_PRIORITY_ORDER[b];
}

export function maxProviderRiskPriority(
  priorities: Array<ProviderRiskPriority | null | undefined>,
): ProviderRiskPriority | null {
  let best: ProviderRiskPriority | null = null;
  for (const p of priorities) {
    if (!p) continue;
    if (best == null || compareProviderRiskPriority(p, best) < 0) {
      best = p;
    }
  }
  return best;
}

export function mapGatingSeverityToPriority(severity: ProviderGatingSeverity): ProviderRiskPriority | null {
  if (severity === "blocking") return "P0";
  if (severity === "warning") return "P2";
  return null;
}

export function buildProviderRiskFixEntry(
  reasonCode: string,
  agentId: string,
  docAnchor?: string,
): ProviderRiskFixEntry {
  const portalBase = `/app/provider/agents/${agentId}`;
  switch (reasonCode) {
    case "provider_gating_sendmessage_task_noncompliant":
    case "provider_gating_cancel_task_required":
    case "provider_health_check_failed":
      return {
        kind: "health_check",
        api_path: `/api/v1/agents/${agentId}/health-check`,
        portal_path: `${portalBase}?focus=health-check`,
        doc_anchor: docAnchor,
        label: "Re-run health check",
      };
    case "a2a_interface_drift":
    case "a2a_compat_grace_expired":
      return {
        kind: "protocol_governance",
        api_path: `/api/v1/agents/${agentId}/protocol-governance`,
        portal_path: `${portalBase}?focus=protocol-governance`,
        doc_anchor: docAnchor,
        label: "Review protocol governance",
      };
    case "provider_gating_extended_card_missing":
    case "provider_gating_extended_card_fetch_failed":
    case "provider_gating_rich_part_missing":
      return {
        kind: "doc",
        api_path: `/api/v1/agents/${agentId}/registration-gating`,
        portal_path: `${portalBase}?focus=registration-gating`,
        doc_anchor: docAnchor,
        label: "View gating guidance",
      };
    default:
      return {
        kind: "registration_gating",
        api_path: `/api/v1/agents/${agentId}/registration-gating`,
        portal_path: `${portalBase}?focus=registration-gating`,
        doc_anchor: docAnchor,
        label: "Open registration gating",
      };
  }
}

export function gatingCheckToRiskQueueItem(
  agentId: string,
  agentName: string,
  check: ProviderGatingCheck,
): ProviderRiskQueueItem | null {
  if (check.severity === "pass") return null;
  const priority = mapGatingSeverityToPriority(check.severity)!;
  return {
    agent_id: agentId,
    agent_name: agentName,
    priority,
    severity: check.severity,
    reason_code: check.reason_code,
    remediation_hint: check.remediation_hint,
    doc_anchor: check.doc_anchor,
    impact_scope: check.severity === "blocking" ? "onboarding" : "enhancement",
    fix_entry: buildProviderRiskFixEntry(check.reason_code, agentId, check.doc_anchor),
  };
}
