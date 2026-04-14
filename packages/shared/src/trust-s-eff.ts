/**
 * E-45: 动态权重 w_post(n_inv)、T/X 事后融合与综合分 S_eff（0–100）。
 * 与 rollup 的 `policy_version` 解耦；本版本仅描述排序/可用性融合公式。
 */
export const TRUST_RANKING_BLEND_POLICY_VERSION = "v161.1-e45-1";

export interface TrustSEffConfig {
  /** n_inv 半饱和尺度：w_post ≈ wPostMax/2 时的样本量近似值 */
  wPostHalfLifeN: number;
  /** w_post 上界（<1 保留冷启动下 S_base 主导） */
  wPostMax: number;
  wCxHalfLifeN: number;
  wCxMax: number;
  /** 无 CX EWMA 时用于 T/X 线性混合的中性 X（0–1） */
  neutralCxScore01: number;
}

export function defaultTrustSEffConfig(): TrustSEffConfig {
  return {
    wPostHalfLifeN: 18,
    wPostMax: 0.88,
    wCxHalfLifeN: 6,
    wCxMax: 0.55,
    neutralCxScore01: 0.5,
  };
}

function clamp100(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

/**
 * 事后轨道权重：随 n_inv 单调不减，n=0 时为 0（完全依赖 S_base / 审核与来源先验）。
 */
export function computeWPost(
  nInv: number,
  cfg: Pick<TrustSEffConfig, "wPostHalfLifeN" | "wPostMax">,
): number {
  const n = Math.max(0, Math.floor(nInv));
  const h = Math.max(1, cfg.wPostHalfLifeN);
  const wMax = Math.max(0, Math.min(0.999, cfg.wPostMax));
  return wMax * (n / (n + h));
}

export function computeWCx(
  nCx: number,
  cfg: Pick<TrustSEffConfig, "wCxHalfLifeN" | "wCxMax">,
): number {
  const n = Math.max(0, Math.floor(nCx));
  const h = Math.max(1, cfg.wCxHalfLifeN);
  const wMax = Math.max(0, Math.min(0.999, cfg.wCxMax));
  return wMax * (n / (n + h));
}

export interface TrustSEffInput {
  /** 审计rollup信誉分 S_base（0–100） */
  sBase0to100: number;
  /** T 轨 EWMA（0–1） */
  techEwma01: number;
  cxEwma01: number | null;
  nInv: number;
  nCx: number;
}

export interface TrustSEffBreakdown {
  sEff: number;
  wPost: number;
  wCx: number;
  sBase: number;
  sT: number;
  sX: number;
  sPost: number;
}

/**
 * S_T = tech_ewma×100；S_X 来自 cx_ewma 或中性点；S_post = (1-w_cx)*S_T + w_cx*S_X；
 * S_eff = (1-w_post)*S_base + w_post*S_post。
 */
export function computeTrustSEff(input: TrustSEffInput, cfg: TrustSEffConfig): TrustSEffBreakdown {
  const sBase = clamp100(input.sBase0to100);
  const sT = clamp100(input.techEwma01 * 100);
  const x01 =
    input.cxEwma01 != null && Number.isFinite(input.cxEwma01)
      ? input.cxEwma01
      : cfg.neutralCxScore01;
  const sX = clamp100(x01 * 100);
  const wCx = computeWCx(input.nCx, cfg);
  const sPost = clamp100((1 - wCx) * sT + wCx * sX);
  const wPost = computeWPost(input.nInv, cfg);
  const sEff = clamp100((1 - wPost) * sBase + wPost * sPost);
  return {
    sEff: Math.round(sEff * 100) / 100,
    wPost,
    wCx,
    sBase,
    sT,
    sX,
    sPost,
  };
}
