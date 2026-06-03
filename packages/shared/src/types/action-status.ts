/**
 * E-54A / OPT-003: user-facing conversation action aggregate (API contract).
 * Locales align with `UserFacingLocaleBundle` in `reason-codes.ts` (en + zhHans + zhHant).
 */

export type ConversationActionStatus =
  | "can_proceed"
  | "needs_confirmation"
  | "blocked_no_permission"
  | "blocked_mandate_incomplete"
  | "blocked_agent_unavailable"
  | "blocked_precondition"
  | "blocked_expired"
  | "blocked_rate_limited";

export type ActionStatusTabHint = "session_status" | "trust_receipt" | "connector_actions";

/** Aligned with OPT-003 action priority for stable client routing. */
export type ConversationActionType =
  | "proceed_execute"
  | "view_detail"
  | "confirm_continue"
  | "cancel_operation"
  | "view_reason"
  | "request_manager_authorization"
  | "contact_conversation_manager"
  /** W-63 / OPT-003A：会话所有者调整 action_policy 与管理者 */
  | "change_policy"
  | "complete_collaboration_authorization"
  | "view_authorization_help"
  | "switch_available_agent"
  | "view_availability_help"
  | "resolve_session_preconditions"
  | "view_precondition_help"
  | "return_to_session_restart"
  | "open_from_latest_notification"
  | "retry_later"
  | "contact_support"
  | `connector_${string}`;

export type ActionStatusLocaleBundle = {
  en: string;
  zhHans: string;
  zhHant: string;
};

export interface ConversationActionItem {
  action_type: ConversationActionType;
  label: ActionStatusLocaleBundle;
  endpoint?: string;
  params?: Record<string, unknown>;
}

export interface ConversationActionStatusResponse {
  status: ConversationActionStatus;
  user_message: ActionStatusLocaleBundle;
  /** 1–2 short sentences per locale; must not expose raw reason_code strings. */
  reason: ActionStatusLocaleBundle;
  actions: ConversationActionItem[];
  receipt_refs?: string[];
  /** Merged user-visible activity (receipts + collaboration audit events), newest first. */
  activity_items: ConversationActivityItem[];
  tab_hint: ActionStatusTabHint;
}

export type ConversationActivityFocusHint = "trust_card" | "receipt" | "connector_receipt";

/** User-facing row in the Safety & activity tab (receipt or audit-backed). */
export type ConversationActivityItem = {
  id: string;
  source: "receipt" | "audit" | "connector";
  occurred_at: string;
  /** receipt_type or audit event_type or connector action */
  type: string;
  label: ActionStatusLocaleBundle;
  receipt_id?: string;
  /** External connector receipt id (cloud/desktop connector action). */
  connector_receipt_id?: string;
  /** When set with focus_hint=trust_card, client may deep-link to the Trust review card. */
  invocation_id?: string;
  focus_hint?: ConversationActivityFocusHint;
};
