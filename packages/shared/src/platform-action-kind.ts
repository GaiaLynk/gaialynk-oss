/**
 * Structured action kinds for platform trust (ADR-0012 P1).
 */

import type { PlatformCapabilityRiskLevel } from "./platform-capability-risk";
import { resolvePlatformCapabilityRisk } from "./platform-capability-risk";

export const PLATFORM_ACTION_KINDS = [
  "agent_invoke",
  "orchestration_step",
  "continuous_task_tick",
  "file_list",
  "file_read",
  "file_write",
  "file_delete",
  "email_send",
  "payment_execute",
  "external_publish",
  "container_ops",
  "privileged_shell",
  "scheduled_task",
  "unknown",
] as const;

export type PlatformActionKind = (typeof PLATFORM_ACTION_KINDS)[number];

export const PLATFORM_ACTION_KIND_RISK: Record<PlatformActionKind, PlatformCapabilityRiskLevel> = {
  agent_invoke: "low",
  orchestration_step: "low",
  continuous_task_tick: "low",
  file_list: "medium",
  file_read: "medium",
  file_write: "high",
  file_delete: "high",
  email_send: "high",
  external_publish: "high",
  payment_execute: "critical",
  container_ops: "medium",
  privileged_shell: "medium",
  scheduled_task: "medium",
  unknown: "low",
};

export type ResolvePlatformActionKindInput = {
  /** Caller-reported kind (orchestration / desktop / future A2A envelope). */
  action_kind?: PlatformActionKind | string;
  capability_name?: string;
  invoke_kind?: "agent_invoke" | "orchestration_step" | "continuous_task";
};

const CAPABILITY_TO_KIND: ReadonlyArray<{ pattern: RegExp; kind: PlatformActionKind }> = [
  { pattern: /(?:^|_)(?:file_write|write_file)(?:_|$)/i, kind: "file_write" },
  { pattern: /(?:^|_)(?:file_delete|delete_file)(?:_|$)/i, kind: "file_delete" },
  { pattern: /(?:^|_)(?:file_read|read_file|file_list)(?:_|$)/i, kind: "file_read" },
  { pattern: /(?:^|_)(?:email_send|send_email)(?:_|$)/i, kind: "email_send" },
  { pattern: /(?:^|_)(?:payment|checkout|transfer)(?:_|$)/i, kind: "payment_execute" },
  { pattern: /(?:^|_)(?:publish|post_external)(?:_|$)/i, kind: "external_publish" },
];

function isPlatformActionKind(raw: string): raw is PlatformActionKind {
  return (PLATFORM_ACTION_KINDS as readonly string[]).includes(raw);
}

export function resolvePlatformActionKind(input: ResolvePlatformActionKindInput): PlatformActionKind {
  const reported = input.action_kind?.trim().toLowerCase();
  if (reported && isPlatformActionKind(reported)) {
    return reported;
  }

  const cap = input.capability_name?.trim().toLowerCase();
  if (cap) {
    for (const rule of CAPABILITY_TO_KIND) {
      if (rule.pattern.test(cap)) return rule.kind;
    }
    const catalogRisk = resolvePlatformCapabilityRisk(cap);
    if (catalogRisk === "critical") return "payment_execute";
    if (catalogRisk === "high") {
      if (/delete|remove|wipe/.test(cap)) return "file_delete";
      if (/email|send|publish|post/.test(cap)) return "email_send";
      return "file_write";
    }
    if (catalogRisk === "medium") {
      if (/file_read|file_list|read/.test(cap)) return "file_read";
    }
  }

  if (input.invoke_kind === "orchestration_step") return "orchestration_step";
  if (input.invoke_kind === "continuous_task") return "continuous_task_tick";
  if (input.invoke_kind === "agent_invoke") return "agent_invoke";
  return "unknown";
}

export function resolvePlatformActionKindRisk(kind: PlatformActionKind): PlatformCapabilityRiskLevel {
  return PLATFORM_ACTION_KIND_RISK[kind] ?? "low";
}
