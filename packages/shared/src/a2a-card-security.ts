/**
 * E-48: Agent Card 安全声明与签名校验 — 共享契约（审核失败项 ID、画像扩展类型）。
 * 规范：A2A Agent Card `securitySchemes` / `security` / `signatures`（JWS + JCS）。
 */

export const A2A_CARD_SECURITY_REVIEW_POLICY_VERSION = "v161.1-e48-1";

/** 审核工作台 / changes_requested 可引用的稳定失败项 ID（与 E-46 failed_check_ids 对齐）。 */
export const A2A_CARD_FAILED_CHECK_SIGNATURE_INVALID = "e48_a2a_card_signature_invalid";

export const A2A_CARD_FAILED_CHECK_SIGNATURES_MALFORMED = "e48_a2a_card_signatures_malformed";

export const A2A_CARD_FAILED_CHECK_SECURITY_SCHEMES_MALFORMED = "e48_a2a_card_security_schemes_malformed";

/** 存在签名但无法拉取 JWKS / 无 jku — 供人工要求 Provider 补全或信任域内密钥。 */
export const A2A_CARD_FAILED_CHECK_SIGNATURE_UNVERIFIED = "e48_a2a_card_signature_unverified";

export const A2A_CARD_SECURITY_CHECKLIST_IDS = [
  A2A_CARD_FAILED_CHECK_SIGNATURE_INVALID,
  A2A_CARD_FAILED_CHECK_SIGNATURES_MALFORMED,
  A2A_CARD_FAILED_CHECK_SECURITY_SCHEMES_MALFORMED,
  A2A_CARD_FAILED_CHECK_SIGNATURE_UNVERIFIED,
] as const;

export type A2aCardSignatureVerificationStatus =
  | "absent"
  | "verified"
  | "invalid"
  | "unverified_no_jwks"
  | "malformed_signatures"
  | "unsupported_alg"
  | "verification_error";

export type A2aCardSecuritySchemeKind =
  | "apiKey"
  | "http"
  | "oauth2"
  | "openIdConnect"
  | "mtls"
  | "unknown";

/** 写入 agents.a2a_interface_profile.card_security（JSONB 子对象）。 */
export type A2aCardSecurityState = {
  signature_verification_status: A2aCardSignatureVerificationStatus;
  signature_count: number;
  security_scheme_keys: string[];
  security_scheme_kinds: A2aCardSecuritySchemeKind[];
  /** 自 OAuth2SecurityScheme.flows 聚合的 flow 键名（如 authorizationCode、deviceCode）。 */
  oauth_flow_hints?: string[];
  /** AgentCard.security 数组中各 requirement 对象的键名并集。 */
  security_requirement_scheme_keys?: string[];
  assessed_at: string;
  verification_detail?: string;
};

export type CardSecurityReviewHints = {
  a2a_card_security_review_policy_version: string;
  suggested_failed_check_ids: string[];
  /** 供审核员扫读的解释性短句（非持久化）。 */
  hint_notes: string[];
};
