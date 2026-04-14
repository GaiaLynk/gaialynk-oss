/**
 * E-54A / OPT-003: English + 简体中文 (zhHans) + 繁体中文 (zhHant), aligned with UserFacingLocaleBundle in reason-codes.ts.
 */
import type {
  ActionStatusLocaleBundle,
  ActionStatusTabHint,
  ConversationActionItem,
  ConversationActionStatus,
  ConversationActionStatusResponse,
} from "./types/action-status";

const L = (en: string, zhHans: string, zhHant: string): ActionStatusLocaleBundle => ({ en, zhHans, zhHant });

/** Headline one-liner per status (OPT-003 第一屏「结论一句话」). */
export const ACTION_STATUS_USER_MESSAGE: Record<ConversationActionStatus, ActionStatusLocaleBundle> = {
  can_proceed: L(
    "You can continue with this step.",
    "这一步可以继续执行。",
    "這一步可以繼續執行。",
  ),
  needs_confirmation: L(
    "Please confirm before this step can continue.",
    "这一步需要你先确认后继续。",
    "這一步需要你先確認後才能繼續。",
  ),
  blocked_no_permission: L(
    "You do not have permission to call this Agent in this conversation.",
    "你当前没有在此会话调用该 Agent 的权限。",
    "你目前沒有在此會話呼叫該 Agent 的權限。",
  ),
  blocked_mandate_incomplete: L(
    "Collaboration authorization is not complete yet, so this step cannot run.",
    "协作授权还不完整，暂时无法执行这一步。",
    "協作授權尚不完整，暫時無法執行這一步。",
  ),
  blocked_agent_unavailable: L(
    "This Agent is not available right now. Please choose another available Agent.",
    "该 Agent 当前不可用，请选择其他可用 Agent。",
    "此 Agent 目前不可用，請選擇其他可用的 Agent。",
  ),
  blocked_precondition: L(
    "This conversation does not yet meet the required conditions for this step.",
    "当前会话条件未满足，暂时不能执行这一步。",
    "目前會話條件未滿足，暫時不能執行這一步。",
  ),
  blocked_expired: L(
    "This invitation or link is no longer valid. Please use the latest entry point.",
    "该邀请或链接已失效，请使用最新入口重试。",
    "此邀請或連結已失效，請使用最新入口重試。",
  ),
  blocked_rate_limited: L(
    "Too many requests right now. Please try again in a moment.",
    "当前请求过于频繁，请稍后再试。",
    "目前請求過於頻繁，請稍後再試。",
  ),
};

/** Default “why” copy (第二屏「为什么」), trilingual. */
export const ACTION_STATUS_REASON: Record<ConversationActionStatus, ActionStatusLocaleBundle> = {
  can_proceed: L(
    "Nothing is blocking this step right now; you can keep the conversation moving.",
    "当前没有拦截或待确认项，你可以继续推进会话。",
    "目前沒有攔截或待確認項目，你可以繼續推進會話。",
  ),
  needs_confirmation: L(
    "The platform needs you to confirm once more before it calls this Agent on your behalf.",
    "平台需要你再确认一次，然后才会代表你调用该 Agent。",
    "平台需要你再確認一次，然後才會代表你呼叫此 Agent。",
  ),
  blocked_no_permission: L(
    "This conversation’s action policy does not let you start this step on your own; a manager needs to help.",
    "会话的动作权限策略不允许你直接发起这一步；需要管理者协助。",
    "會話的動作權限策略不允許你直接發起這一步；需要管理者協助。",
  ),
  blocked_mandate_incomplete: L(
    "Collaboration authorization (what you allow this Agent to do in this conversation) is not sufficient yet.",
    "协作授权（你与 Agent 的授权范围）还不满足本次操作的要求。",
    "協作授權（你與 Agent 的授權範圍）尚不符合本次操作的要求。",
  ),
  blocked_agent_unavailable: L(
    "The target Agent is not in a callable state (for example, not in the public hub pool or under maintenance).",
    "目标 Agent 未处于可调用状态（例如未上架主池或维护中）。",
    "目標 Agent 未處於可呼叫狀態（例如未上架主池或維護中）。",
  ),
  blocked_precondition: L(
    "Something on the conversation or Space side is still missing (for example membership or Space mismatch).",
    "会话或空间侧还有未满足的前置条件（例如成员关系或空间不一致）。",
    "會話或空間側還有未滿足的前置條件（例如成員關係或空間不一致）。",
  ),
  blocked_expired: L(
    "The invitation or link you used is no longer valid; open the conversation again from a fresh notification or entry point.",
    "你打开的邀请或链接已经失效，请从新的通知或会话入口重试。",
    "你開啟的邀請或連結已失效，請從新的通知或會話入口重試。",
  ),
  blocked_rate_limited: L(
    "The system is protecting stability; please wait briefly and try again.",
    "系统正在保护服务稳定性，请稍等片刻再试。",
    "系統正在保護服務穩定性，請稍候片刻再試。",
  ),
};

function actionsFor(
  status: ConversationActionStatus,
  ctx: { conversationId: string; invocationId?: string },
): ConversationActionItem[] {
  const { conversationId, invocationId } = ctx;
  switch (status) {
    case "can_proceed":
      return [
        {
          action_type: "proceed_execute",
          label: L("Continue", "继续执行", "繼續執行"),
          endpoint: `/api/v1/conversations/${conversationId}/messages`,
          params: { method: "POST" },
        },
        {
          action_type: "view_detail",
          label: L("View details", "查看详情", "查看詳情"),
          endpoint: `/api/v1/conversations/${conversationId}`,
          params: { method: "GET" },
        },
      ];
    case "needs_confirmation":
      return [
        {
          action_type: "confirm_continue",
          label: L(
    "Confirm and continue",
    "确认继续",
    "確認並繼續",
  ),
          endpoint: invocationId ? `/api/v1/approvals/${invocationId}/confirm` : undefined,
          params: invocationId
            ? { method: "POST", body: { approver_id: "{current_user_id}" } }
            : undefined,
        },
        {
          action_type: "cancel_operation",
          label: L(
    "Cancel this action",
    "取消本次操作",
    "取消本次操作",
  ),
          endpoint: invocationId ? `/api/v1/approvals/${invocationId}/reject` : undefined,
          params: invocationId ? { method: "POST" } : undefined,
        },
        {
          action_type: "view_reason",
          label: L(
    "View why",
    "查看原因",
    "查看原因",
  ),
          endpoint: `/api/v1/approvals?conversation_id=${encodeURIComponent(conversationId)}`,
          params: { method: "GET" },
        },
      ];
    case "blocked_no_permission":
      return [
        {
          action_type: "request_manager_authorization",
          label: L(
    "Request manager approval",
    "申请会话管理者授权",
    "申請會話管理者授權",
  ),
        },
        {
          action_type: "contact_conversation_manager",
          label: L(
    "Contact a conversation manager",
    "联系会话管理者",
    "聯繫會話管理者",
  ),
        },
      ];
    case "blocked_mandate_incomplete":
      return [
        {
          action_type: "complete_collaboration_authorization",
          label: L(
    "Complete collaboration authorization",
    "去补协作授权",
    "前往補齊協作授權",
  ),
          endpoint: `/api/v1/mandates/active`,
          params: { method: "GET" },
        },
        {
          action_type: "view_authorization_help",
          label: L(
    "View authorization notes",
    "查看授权说明",
    "查看授權說明",
  ),
        },
      ];
    case "blocked_agent_unavailable":
      return [
        {
          action_type: "switch_available_agent",
          label: L(
    "Switch Agent",
    "切换可用 Agent",
    "切換可用的 Agent",
  ),
          endpoint: `/api/v1/agents`,
          params: { method: "GET" },
        },
        {
          action_type: "view_availability_help",
          label: L(
    "View availability help",
    "查看可用状态说明",
    "查看可用狀態說明",
  ),
        },
      ];
    case "blocked_precondition":
      return [
        {
          action_type: "resolve_session_preconditions",
          label: L(
    "Resolve preconditions",
    "去补齐会话前置条件",
    "前往補齊會話前置條件",
  ),
        },
        {
          action_type: "view_precondition_help",
          label: L(
    "How to resolve",
    "查看如何补齐",
    "查看如何補齊",
  ),
        },
      ];
    case "blocked_expired":
      return [
        {
          action_type: "return_to_session_restart",
          label: L(
    "Return and retry",
    "返回会话重新发起",
    "返回會話重新發起",
  ),
          endpoint: `/api/v1/conversations/${conversationId}`,
          params: { method: "GET" },
        },
        {
          action_type: "open_from_latest_notification",
          label: L(
    "Open from latest notification",
    "从最新通知打开",
    "從最新通知開啟",
  ),
        },
      ];
    case "blocked_rate_limited":
      return [
        {
          action_type: "retry_later",
          label: L(
    "Try again later",
    "稍后重试",
    "稍後再試",
  ),
        },
        {
          action_type: "contact_support",
          label: L(
    "Contact support",
    "联系支持",
    "聯繫支援",
  ),
        },
      ];
    default:
      return [];
  }
}

/** W-63：右栏/状态卡「会话动作权限」入口（仅服务端对 owner 追加 extraActions 时使用）。 */
export function buildChangePolicyConversationAction(): ConversationActionItem {
  return {
    action_type: "change_policy",
    label: L(
      "Session action permissions…",
      "会话动作权限…",
      "\u6703\u8a71\u52d5\u4f5c\u6b0a\u9650\u2026",
    ),
  };
}


export function computeTabHint(status: ConversationActionStatus, actions: ConversationActionItem[]): ActionStatusTabHint {
  if (status === "needs_confirmation" || status.startsWith("blocked_")) {
    return "trust_receipt";
  }
  if (actions.some((a) => String(a.action_type).startsWith("connector_"))) {
    return "connector_actions";
  }
  return "session_status";
}

export function buildConversationActionStatusResponse(input: {
  status: ConversationActionStatus;
  reasonOverride?: ActionStatusLocaleBundle;
  conversationId: string;
  invocationId?: string;
  receiptRefs?: string[];
  extraActions?: ConversationActionItem[];
}): ConversationActionStatusResponse {
  const actions = [
    ...actionsFor(input.status, { conversationId: input.conversationId, invocationId: input.invocationId }),
    ...(input.extraActions ?? []),
  ];
  const tab_hint = computeTabHint(input.status, actions);
  const reason = input.reasonOverride ?? ACTION_STATUS_REASON[input.status];
  return {
    status: input.status,
    user_message: ACTION_STATUS_USER_MESSAGE[input.status],
    reason,
    actions,
    ...(input.receiptRefs && input.receiptRefs.length > 0 ? { receipt_refs: input.receiptRefs } : {}),
    tab_hint,
  };
}
