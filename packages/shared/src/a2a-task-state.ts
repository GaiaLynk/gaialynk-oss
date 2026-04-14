/**
 * E-41: A2A 1.0.0 Task 状态统一语义 — 网关 / 计费 / Trust（T 轨）共用契约。
 * 规范：`TASK_STATE_*` 字符串；美式 `TASK_STATE_CANCELED` 为唯一规范拼写，`CANCELLED` 仅作入站归一化。
 */

export const TASK_STATE_SUBMITTED = "TASK_STATE_SUBMITTED" as const;
export const TASK_STATE_WORKING = "TASK_STATE_WORKING" as const;
export const TASK_STATE_COMPLETED = "TASK_STATE_COMPLETED" as const;
export const TASK_STATE_FAILED = "TASK_STATE_FAILED" as const;
export const TASK_STATE_CANCELED = "TASK_STATE_CANCELED" as const;
export const TASK_STATE_INPUT_REQUIRED = "TASK_STATE_INPUT_REQUIRED" as const;
export const TASK_STATE_REJECTED = "TASK_STATE_REJECTED" as const;
export const TASK_STATE_AUTH_REQUIRED = "TASK_STATE_AUTH_REQUIRED" as const;

export type A2aTaskState =
  | typeof TASK_STATE_SUBMITTED
  | typeof TASK_STATE_WORKING
  | typeof TASK_STATE_COMPLETED
  | typeof TASK_STATE_FAILED
  | typeof TASK_STATE_CANCELED
  | typeof TASK_STATE_INPUT_REQUIRED
  | typeof TASK_STATE_REJECTED
  | typeof TASK_STATE_AUTH_REQUIRED;

const KNOWN: ReadonlySet<string> = new Set([
  TASK_STATE_SUBMITTED,
  TASK_STATE_WORKING,
  TASK_STATE_COMPLETED,
  TASK_STATE_FAILED,
  TASK_STATE_CANCELED,
  TASK_STATE_INPUT_REQUIRED,
  TASK_STATE_REJECTED,
  TASK_STATE_AUTH_REQUIRED,
]);

/** 英式拼写 → 美式规范（出站与持久化一律 `CANCELED`） */
export function normalizeA2aTaskStateString(raw: string | undefined | null): A2aTaskState | undefined {
  if (raw == null || raw === "") return undefined;
  const s = String(raw).trim();
  if (s === "TASK_STATE_CANCELLED") return TASK_STATE_CANCELED;
  if (KNOWN.has(s)) return s as A2aTaskState;
  return undefined;
}

export function isContinuableA2aTaskState(state: A2aTaskState | undefined): boolean {
  if (state == null) return false;
  return (
    state === TASK_STATE_SUBMITTED ||
    state === TASK_STATE_WORKING ||
    state === TASK_STATE_INPUT_REQUIRED ||
    state === TASK_STATE_AUTH_REQUIRED
  );
}

export function isNegativeTerminalA2aTaskState(state: A2aTaskState | undefined): boolean {
  if (state == null) return false;
  return state === TASK_STATE_FAILED || state === TASK_STATE_REJECTED || state === TASK_STATE_CANCELED;
}

export function isBillableSuccessTerminal(state: A2aTaskState | undefined): boolean {
  return state === TASK_STATE_COMPLETED;
}

/**
 * T 轨聚合：成功完成（计 success）、可续接轮次（不计入 completed/failed 率）、负向终态（计 failed）。
 */
export type A2aTrustRollupOutcome = "success" | "continues" | "negative_terminal";

export function resolveA2aTrustRollupOutcome(
  state: A2aTaskState | undefined,
  legacyTaskComplete: boolean | undefined,
): A2aTrustRollupOutcome {
  if (state && isNegativeTerminalA2aTaskState(state)) return "negative_terminal";
  if (state && isContinuableA2aTaskState(state)) return "continues";
  if (state === TASK_STATE_COMPLETED) return "success";
  if (state == null && legacyTaskComplete === true) return "success";
  return "continues";
}

export type TaskSessionA2aFinalization =
  | { kind: "none" }
  | { kind: "success_complete" }
  | { kind: "negative"; endReason: "a2a_task_failed" | "a2a_task_rejected" | "a2a_task_canceled" };

/**
 * 计费 / Task Session：何时关单、是否按「成功完成」走 agent_complete 结算。
 */
export function resolveTaskSessionFinalizationFromA2a(
  state: A2aTaskState | undefined,
  legacyTaskComplete: boolean | undefined,
): TaskSessionA2aFinalization {
  if (state === TASK_STATE_FAILED) return { kind: "negative", endReason: "a2a_task_failed" };
  if (state === TASK_STATE_REJECTED) return { kind: "negative", endReason: "a2a_task_rejected" };
  if (state === TASK_STATE_CANCELED) return { kind: "negative", endReason: "a2a_task_canceled" };
  if (state && isContinuableA2aTaskState(state)) return { kind: "none" };
  if (state === TASK_STATE_COMPLETED || (state == null && legacyTaskComplete === true)) {
    return { kind: "success_complete" };
  }
  return { kind: "none" };
}

/** 非成功终态关单时不做 per_session 成功结算（与 end_reason 对齐） */
export const A2A_NON_BILLABLE_SESSION_END_REASONS: ReadonlySet<string> = new Set([
  "a2a_task_failed",
  "a2a_task_rejected",
  "a2a_task_canceled",
]);
