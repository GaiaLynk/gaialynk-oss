/**
 * Platform-owned capability risk catalog (V1.6 S-1 / action-trust resolver).
 * Provider declarations are hints; this table is the platform floor (and override for known high-risk names).
 */

export type PlatformCapabilityRiskLevel = "low" | "medium" | "high" | "critical";

const RISK_RANK: Record<PlatformCapabilityRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** Exact capability name → platform baseline risk. */
export const PLATFORM_CAPABILITY_RISK_EXACT: Record<string, PlatformCapabilityRiskLevel> = {
  general: "low",
  task: "low",
  summarize: "low",
  summarization: "low",
  document_summarization: "low",
  text_generation: "low",
  short_form_script: "low",
  social_copy_pack: "low",
  translation: "low",
  translate: "low",
  localization: "low",
  scheduling: "low",
  content_creation: "low",
  creative: "low",
  legal_review: "medium",
  procurement: "medium",
  data_analysis: "low",
  file_list: "medium",
  file_read: "medium",
  file_write: "high",
  file_delete: "high",
  email_send: "high",
  "gmail.read": "medium",
  "gmail.compose": "medium",
  "gmail.send": "high",
  "google_drive.read": "medium",
  "google_drive.write": "high",
  "box.read": "medium",
  "box.write": "high",
  "canva.read": "low",
  "canva.write": "medium",
  "canva.export": "medium",
  "gamma.read": "low",
  "gamma.write": "medium",
  payment: "critical",
  payment_execute: "critical",
  admin: "high",
};

/** Substring / pattern rules applied when exact match misses. */
export const PLATFORM_CAPABILITY_RISK_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  risk: PlatformCapabilityRiskLevel;
}> = [
  { pattern: /(?:^|_)(?:write|delete|remove|wipe|purge)(?:_|$)/i, risk: "high" },
  { pattern: /(?:^|_)(?:payment|charge|transfer|checkout)(?:_|$)/i, risk: "critical" },
  { pattern: /(?:^|_)(?:email_send|send_email|publish|post_external)(?:_|$)/i, risk: "high" },
  { pattern: /(?:^|_)admin(?:_|$)/i, risk: "high" },
];

/** When a capability name is unknown to the catalog, platform floor is low (no elevation by default). */
export const PLATFORM_UNKNOWN_CAPABILITY_RISK: PlatformCapabilityRiskLevel = "low";

export function maxPlatformCapabilityRisk(
  a: PlatformCapabilityRiskLevel,
  b: PlatformCapabilityRiskLevel,
): PlatformCapabilityRiskLevel {
  return RISK_RANK[a] >= RISK_RANK[b] ? a : b;
}

/** Resolve platform baseline risk for a declared capability name. */
export function resolvePlatformCapabilityRisk(capabilityName: string): PlatformCapabilityRiskLevel {
  const key = capabilityName.trim().toLowerCase();
  if (!key) return PLATFORM_UNKNOWN_CAPABILITY_RISK;
  const exact = PLATFORM_CAPABILITY_RISK_EXACT[key];
  if (exact) return exact;
  for (const rule of PLATFORM_CAPABILITY_RISK_PATTERNS) {
    if (rule.pattern.test(key)) return rule.risk;
  }
  return PLATFORM_UNKNOWN_CAPABILITY_RISK;
}
