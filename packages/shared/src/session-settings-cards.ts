/**
 * E-112 V1.7.4：会话设置四卡统一模型 — 跨单/多 Agent 与多人场景的默认可渲染契约。
 * 跨卡关系仅为提示（hint），不得映射为服务端硬门禁。
 */

export const SESSION_SETTINGS_CARDS_CONTRACT_VERSION = "1" as const;

/** 与 CTO §0 / W-68 四卡顺序一致（信息层级，非强制流程）。 */
export type SessionSettingsCardId =
  | "action_permissions"
  | "desktop_workspace"
  | "conversation_tasks"
  | "subconversation_collaboration";

export type SessionSettingsCrossHintLevel = "info" | "suggestion";

export interface SessionSettingsCrossHint {
  level: SessionSettingsCrossHintLevel;
  from_card: SessionSettingsCardId;
  to_card: SessionSettingsCardId;
  /** 稳定码供官网/BFF 映射文案；非用户可见句子。 */
  hint_code: string;
}

/** V1.7.1 协作策略字段（与主线 `conversation_collaboration_policies` 对齐的子集）。 */
export type CollaborationChildCreationPermissionV1 =
  | "owner_or_manager"
  | "all_human_accounts"
  | "specified_agents"
  | "all_agents";

export type CollaborationChildInviteModeV1 = "single_external_agent" | "multi_external_agents";

export type CollaborationAgentExecutionModeV1 = "requires_manager_approval" | "auto_by_policy";

export interface SessionSettingsCollaborationPolicySnapshotV1 {
  child_creation_permission: CollaborationChildCreationPermissionV1;
  child_invite_mode: CollaborationChildInviteModeV1;
  agent_execution_mode: CollaborationAgentExecutionModeV1;
  designated_manager_user_ids: string[];
  allowed_creator_agent_ids: string[];
  sub_session_intent_notes: string | null;
  target_agent_external_invite_allowed: boolean;
  external_invite_requires_main_manager_review: boolean;
}

/** Soft signals for collapsible 「A2A协作」summary — not enforcement gates (E-113). */
export interface SessionSettingsA2aInviteCapabilitiesV1 {
  /** 会话内 ≥1 Agent 且协作策略允许向外部对等 Agent 发起来往（与 policy.target_agent_external_invite_allowed 对齐）。 */
  outbound_peer_invite_signal: boolean;
  /** viewer 是否为「可被邀请」：存在有效 discover 标记的未完成 invocation（按 requester）。 */
  inbound_discovery_live_for_viewer: boolean;
  inbound_discoverable_invocation_count_for_viewer: number;
}

export interface SessionSettingsCardsBundleV1 {
  contract_version: typeof SESSION_SETTINGS_CARDS_CONTRACT_VERSION;
  /** 供给右栏判断单/多 Agent 等，无需客户端再从 participants 推导。 */
  scene_summary: {
    human_participant_count: number;
    agent_participant_count: number;
  };
  cards: {
    action_permissions: {
      /** 四卡语义为全场景通用能力，与拓扑无关。 */
      applies_to_all_conversation_scenes: true;
      action_policy: "owner_admin_only" | "all_with_approval" | "all_open";
      /** CTO 默认：`owner_admin_only`。 */
      is_default_owner_admin_only: boolean;
    };
    desktop_workspace: {
      binding_status: "unbound" | "bound";
      binding: null | {
        device_id: string;
        root_index?: number;
        anchor_relative_path?: string;
      };
    };
    conversation_tasks: {
      active_orchestration_run_count: number;
      active_continuous_task_count: number;
      /** 「无任务」默认态：无活跃编排 Run 且无运行中持续任务。 */
      is_default_no_tasks: boolean;
    };
    subconversation_collaboration: {
      policy: SessionSettingsCollaborationPolicySnapshotV1;
      child_conversation_count: number;
      is_default_no_children: boolean;
      /** 与 E-103 平台默认协作策略（库缺行时回落）一致。 */
      is_platform_default_collaboration_policy: boolean;
      /** 同一用户对「主动邀出 / 可被他人发现」二象限摘要；仅登录且可解析 viewer 时返回。 */
      a2a_invite_capabilities_v1?: SessionSettingsA2aInviteCapabilitiesV1;
    };
  };
  cross_hints: SessionSettingsCrossHint[];
}

/** CTO V1.7.4 冻结的动作权限默认。 */
export const DEFAULT_SESSION_SETTINGS_ACTION_POLICY = "owner_admin_only" as const;

/** 与 `conversation-collaboration.store` `defaultPolicy` 语义对齐，供客户端比较「是否仍为平台默认」。 */
export const PLATFORM_DEFAULT_COLLABORATION_POLICY_SNAPSHOT_V1: SessionSettingsCollaborationPolicySnapshotV1 = {
  child_creation_permission: "specified_agents",
  child_invite_mode: "single_external_agent",
  agent_execution_mode: "requires_manager_approval",
  designated_manager_user_ids: [],
  allowed_creator_agent_ids: [],
  sub_session_intent_notes: null,
  target_agent_external_invite_allowed: true,
  external_invite_requires_main_manager_review: false,
};

export function collaborationPolicyEqualsPlatformDefaultV1(
  p: SessionSettingsCollaborationPolicySnapshotV1,
): boolean {
  const d = PLATFORM_DEFAULT_COLLABORATION_POLICY_SNAPSHOT_V1;
  if (
    p.child_creation_permission !== d.child_creation_permission ||
    p.child_invite_mode !== d.child_invite_mode ||
    p.agent_execution_mode !== d.agent_execution_mode
  ) {
    return false;
  }
  if (p.sub_session_intent_notes !== null && String(p.sub_session_intent_notes).trim().length > 0) {
    return false;
  }
  if (p.target_agent_external_invite_allowed !== d.target_agent_external_invite_allowed) {
    return false;
  }
  if (p.external_invite_requires_main_manager_review !== d.external_invite_requires_main_manager_review) {
    return false;
  }
  if (p.designated_manager_user_ids.length !== 0 || p.allowed_creator_agent_ids.length !== 0) {
    return false;
  }
  return true;
}

/**
 * 仅生成「软提示」：不阻断主流程、不表达硬依赖顺序。
 */
export function computeSessionSettingsCrossHints(input: {
  desktop_binding_status: "unbound" | "bound";
  agent_participant_count: number;
}): SessionSettingsCrossHint[] {
  const hints: SessionSettingsCrossHint[] = [];
  if (input.desktop_binding_status === "unbound") {
    hints.push({
      level: "suggestion",
      from_card: "desktop_workspace",
      to_card: "conversation_tasks",
      hint_code: "local_execution_may_need_desktop_bind",
    });
  }
  if (input.agent_participant_count >= 2) {
    hints.push({
      level: "info",
      from_card: "action_permissions",
      to_card: "conversation_tasks",
      hint_code: "multi_agent_orchestration_context",
    });
  }
  return hints;
}
