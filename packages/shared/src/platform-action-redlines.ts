/**
 * Platform action redlines / yellow lines (ADR-0012).
 * Single source for invoke-time trust and data-boundary deny rules.
 */

import type { PlatformCapabilityRiskLevel } from "./platform-capability-risk";

export type PlatformRedlineTier = "critical" | "yellow";

export type PlatformRedlineMatch = {
  tier: PlatformRedlineTier;
  reason_code: string;
  risk: PlatformCapabilityRiskLevel;
};

const CRITICAL_RULES: ReadonlyArray<{ regex: RegExp; reason_code: string }> = [
  { regex: /\bignore\s+previous\s+instructions?\b/i, reason_code: "prompt_injection_ignore_previous" },
  { regex: /\bsystem\s+prompt\b/i, reason_code: "prompt_injection_system_prompt_exfiltration" },
  { regex: /<\s*system\s*>/i, reason_code: "prompt_injection_system_tag" },
  { regex: /\bapi[\s_-]?keys?\b/i, reason_code: "sensitive_data_exfiltration_attempt" },
  { regex: /\bapi\s+tokens?\b/i, reason_code: "sensitive_data_exfiltration_attempt" },
  {
    regex: /\b(bearer|access|refresh|auth|authentication|oauth|session)[\s_-]+tokens?\b/i,
    reason_code: "sensitive_data_exfiltration_attempt",
  },
  { regex: /\b(secrets?|passwords?|credentials?)\s*[:=]\s*/i, reason_code: "sensitive_data_exfiltration_attempt" },
  {
    regex: /\b(your|my|our)\s+(api[\s_-]?key|password|credential)s?\b/i,
    reason_code: "sensitive_data_exfiltration_attempt",
  },
  { regex: /\b(drop\s+table|rm\s+-rf|format\s+c:)\b/i, reason_code: "platform_redline_destructive" },
  { regex: /删库|格式化磁盘|rm\s+-rf/u, reason_code: "platform_redline_destructive" },
  { regex: /\b(wget|curl)\s+.+\|\s*(ba)?sh\b/i, reason_code: "platform_redline_untrusted_download_pipe" },
  { regex: /curl\s+.+\|\s*bash|wget\s+.+\|\s*sh/u, reason_code: "platform_redline_untrusted_download_pipe" },
];

/** Yellow-line: audited allow_limited at medium — not per-invoke confirm (ADR-0012 P1). */
const YELLOW_RULES: ReadonlyArray<{ regex: RegExp; reason_code: string }> = [
  { regex: /\b(docker\s+run|docker\s+compose|kubectl\s+apply)\b/i, reason_code: "platform_yellow_container_ops" },
  { regex: /\b(sudo\s+|chmod\s+|chattr\s+)\b/i, reason_code: "platform_yellow_privilege_escalation" },
  { regex: /\b(crontab|cron\s+-)\b/i, reason_code: "platform_yellow_scheduled_task" },
  { regex: /docker\s+运行|提权|计划任务/u, reason_code: "platform_yellow_scheduled_task" },
];

export function matchPlatformActionRedlines(text: string | undefined): PlatformRedlineMatch | null {
  const t = text?.trim();
  if (!t) return null;

  for (const rule of CRITICAL_RULES) {
    if (rule.regex.test(t)) {
      return { tier: "critical", reason_code: rule.reason_code, risk: "critical" };
    }
  }

  for (const rule of YELLOW_RULES) {
    if (rule.regex.test(t)) {
      return { tier: "yellow", reason_code: rule.reason_code, risk: "medium" };
    }
  }

  return null;
}
