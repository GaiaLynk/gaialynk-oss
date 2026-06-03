/**
 * E-48: Agent Card 安全声明与签名校验 — 共享契约（审核失败项 ID、画像扩展类型）。
 * 规范：A2A Agent Card `securitySchemes` / `security` / `signatures`（JWS + JCS）。
 */

export const A2A_CARD_SECURITY_REVIEW_POLICY_VERSION = "v1763.1-e48-oauth-1";

/** 审核工作台 / changes_requested 可引用的稳定失败项 ID（与 E-46 failed_check_ids 对齐）。 */
export const A2A_CARD_FAILED_CHECK_SIGNATURE_INVALID = "e48_a2a_card_signature_invalid";

export const A2A_CARD_FAILED_CHECK_SIGNATURES_MALFORMED = "e48_a2a_card_signatures_malformed";

export const A2A_CARD_FAILED_CHECK_SECURITY_SCHEMES_MALFORMED = "e48_a2a_card_security_schemes_malformed";

/** 存在签名但无法拉取 JWKS / 无 jku — 供人工要求 Provider 补全或信任域内密钥。 */
export const A2A_CARD_FAILED_CHECK_SIGNATURE_UNVERIFIED = "e48_a2a_card_signature_unverified";

/** E-1763-D (V1.7.6.3)：Agent Card 声明 OAuth2 `implicit` / `password` 等已废弃 flow。 */
export const A2A_CARD_FAILED_CHECK_OAUTH_DEPRECATED_FLOWS = "e1763_a2a_oauth_deprecated_flows";

/** A2A OAuth2SecurityScheme.flows 推荐 flow（OpenAPI / OAuth 2.1 对齐）。 */
export const A2A_OAUTH_RECOMMENDED_FLOW_KEYS = [
  "authorizationCode",
  "clientCredentials",
  "deviceCode",
] as const;

/** A2A OAuth2SecurityScheme.flows 已废弃 flow（平台 review 标红，不阻断基础调用）。 */
export const A2A_OAUTH_DEPRECATED_FLOW_KEYS = ["implicit", "password"] as const;

export type A2aOAuthFlowKey =
  | (typeof A2A_OAUTH_RECOMMENDED_FLOW_KEYS)[number]
  | (typeof A2A_OAUTH_DEPRECATED_FLOW_KEYS)[number]
  | string;

export const A2A_CARD_SECURITY_CHECKLIST_IDS = [
  A2A_CARD_FAILED_CHECK_SIGNATURE_INVALID,
  A2A_CARD_FAILED_CHECK_SIGNATURES_MALFORMED,
  A2A_CARD_FAILED_CHECK_SECURITY_SCHEMES_MALFORMED,
  A2A_CARD_FAILED_CHECK_SIGNATURE_UNVERIFIED,
  A2A_CARD_FAILED_CHECK_OAUTH_DEPRECATED_FLOWS,
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
  /** E-1763-D：从 oauth_flow_hints 筛出的已废弃 flow（implicit / password）。 */
  oauth_deprecated_flows?: string[];
  /** E-1763-D：从 oauth_flow_hints 筛出的推荐 flow。 */
  oauth_recommended_flows?: string[];
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
  /** E-1763-D：是否检测到 deprecated OAuth flow（Flag 开时有意义）。 */
  oauth_deprecated_flows_detected?: boolean;
  /** E-1763-D：deprecated flow 列表（如 implicit、password）。 */
  oauth_deprecated_flows?: string[];
  /** E-1763-D：建议审核员使用「可调用但受限」态（映射 APPROVED_WITH_CONDITIONS）。 */
  suggested_audit_state?: "APPROVED_WITH_CONDITIONS";
};
