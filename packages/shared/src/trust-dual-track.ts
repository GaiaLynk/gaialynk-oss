/**
 * E-44: T / X 双轨评分聚合 — 共享常量与类型（与 `policy_version` 字段对齐）。
 * 公式或分桶规则变更时必须递增版本字符串。
 */
export const TRUST_DUAL_TRACK_POLICY_VERSION = "v161.1-e44-1";

export type TrustTxSampleBucket = "production" | "test_account" | "provider_self" | "excluded_invalid";

export type TrustCxSampleBucket = TrustTxSampleBucket;
