/**
 * Trust / policy reason_codes → 用户可见文案（与产品语言一致：en / zh-Hans / zh-Hant）。
 * Shared by mainline server and website (E-15)。
 */

export type UserFacingLocaleBundle = {
  zhHans: string;
  zhHant: string;
  en: string;
};

const UNKNOWN: UserFacingLocaleBundle = {
  zhHans: "系统已记录该事件；如需详情请联系管理员或查看审计记录。",
  zhHant: "系統已記錄該事件；如需詳情請聯絡管理員或查看稽核記錄。",
  en: "This event was recorded. Contact support or check audit logs for details.",
};

const TRUST_REVIEW_PENDING: UserFacingLocaleBundle = {
  zhHans: "该调用正在等待人工或策略审批，请稍后在审批队列中处理。",
  zhHant: "該呼叫正在等待人工或策略審批，請稍後在審批佇列中處理。",
  en: "This invocation is awaiting policy or human review. Please check the review queue.",
};

export const REASON_CODE_USER_FACING: Record<string, UserFacingLocaleBundle> = {
  identity_unverified: {
    zhHans: "无法验证该 Agent 的身份，已按策略拒绝执行。",
    zhHant: "無法驗證該 Agent 的身分，已按策略拒絕執行。",
    en: "This agent’s identity could not be verified; execution was denied by policy.",
  },
  capability_not_declared: {
    zhHans: "请求的能力未在 Agent 卡片中声明，已拒绝调用。",
    zhHant: "請求的能力未在 Agent 卡片中聲明，已拒絕呼叫。",
    en: "The requested capability is not declared on the agent card; the call was denied.",
  },
  risk_critical_denied: {
    zhHans: "该能力被标记为极高风险，当前策略不允许自动执行。",
    zhHant: "該能力被標記為極高風險，目前策略不允許自動執行。",
    en: "This capability is classified as critical risk and cannot run automatically under policy.",
  },
  risk_high_requires_confirmation: {
    zhHans: "该操作风险较高，需要您确认后才能继续。",
    zhHant: "該操作風險較高，需要您確認後才能繼續。",
    en: "This action is high risk and requires your confirmation before it can proceed.",
  },
  identity_verified: {
    zhHans: "身份校验已通过。",
    zhHant: "身分校驗已通過。",
    en: "Identity checks passed.",
  },
  capability_declared: {
    zhHans: "能力声明与请求一致。",
    zhHant: "能力聲明與請求一致。",
    en: "The capability is declared and matches the request.",
  },
  risk_acceptable: {
    zhHans: "当前风险等级在可接受范围内。",
    zhHant: "目前風險等級在可接受範圍內。",
    en: "Risk level is acceptable under current policy.",
  },
  delegation_scope_violation: {
    zhHans: "该调用超出委托授权范围，已被拦截。",
    zhHant: "該呼叫超出委託授權範圍，已被攔截。",
    en: "This call falls outside the delegated scope and was blocked.",
  },
  prompt_injection_ignore_previous: {
    zhHans: "检测到可能忽略先前指令的内容，已按数据边界策略拦截。",
    zhHant: "偵測到可能忽略先前指令的內容，已按資料邊界策略攔截。",
    en: "Content that may ignore prior instructions was detected and blocked by data-boundary policy.",
  },
  prompt_injection_system_prompt_exfiltration: {
    zhHans: "检测到试图套取系统提示的内容，已拦截。",
    zhHant: "偵測到試圖套取系統提示的內容，已攔截。",
    en: "Attempt to extract system prompt content was detected and blocked.",
  },
  prompt_injection_system_tag: {
    zhHans: "检测到可疑的系统标签片段，已拦截。",
    zhHant: "偵測到可疑的系統標籤片段，已攔截。",
    en: "Suspicious system-like tags were detected and blocked.",
  },
  sensitive_data_exfiltration_attempt: {
    zhHans: "检测到疑似密钥或令牌等敏感信息，已拦截转发。",
    zhHant: "偵測到疑似金鑰或權杖等敏感資訊，已攔截轉發。",
    en: "Possible secrets or tokens were detected; forwarding was blocked.",
  },
  boundary_pass: {
    zhHans: "数据边界检查通过。",
    zhHant: "資料邊界檢查通過。",
    en: "Data boundary checks passed.",
  },
  sensitive_domain_disclaimer: {
    zhHans: "输出涉及敏感领域，已附加免责声明；请谨慎采纳。",
    zhHant: "輸出涉及敏感領域，已附加免責聲明；請謹慎採納。",
    en: "Sensitive-domain disclaimer applies; use judgment when acting on this output.",
  },
  not_for_retraining_boundary: {
    zhHans: "内容受数据使用边界约束，请勿用于再训练或二次分发。",
    zhHant: "內容受資料使用邊界約束，請勿用於再訓練或二次分發。",
    en: "Content is subject to a no-retraining / redistribution boundary.",
  },
  trust_review_pending: TRUST_REVIEW_PENDING,
  /** E-58 / OPT-003A: session action_policy — member needs owner/admin to approve before A2A */
  action_policy_requires_manager_approval: {
    zhHans: "根据本会话的动作权限策略，需要会话管理者批准后才能代表你调用该 Agent。",
    zhHant: "依本會話的動作權限策略，需要會話管理者核準後，平台才能代表你呼叫此 Agent。",
    en: "Under this conversation's action policy, a conversation manager must approve before the platform can invoke this agent on your behalf.",
  },
  /** E-101 V1.7.1：未登录用户不得拉 Agent 入会话 */
  auth_required_for_agent_invite: {
    zhHans: "邀请 Agent 加入会话前请先登录。",
    zhHant: "邀請 Agent 加入會話前請先登入。",
    en: "Sign in before inviting an agent to this conversation.",
  },
  /** E-101：匿名只读会话不允许邀请 Agent */
  anonymous_conversation_agent_forbidden: {
    zhHans: "当前会话为匿名只读模式，无法邀请 Agent。",
    zhHant: "目前會話為匿名唯讀模式，無法邀請 Agent。",
    en: "This conversation is anonymous read-only; agents cannot be invited.",
  },
  /** E-58: owner_admin_only — caller is not owner or admin participant */
  action_policy_owner_admin_only: {
    zhHans: "你当前没有在此会话调用该 Agent 的权限。",
    zhHant: "你目前沒有在此會話呼叫該 Agent 的權限。",
    en: "You do not have permission to call this agent in this conversation.",
  },
  /** E-15: Agent listing / gateway lifecycle */
  agent_maintenance: {
    zhHans: "该 Agent 处于维护中，暂不接受新的调用；已在执行的请求会继续完成。",
    zhHant: "該 Agent 處於維護中，暫不接受新的呼叫；已在執行的請求會繼續完成。",
    en: "This agent is in maintenance and is not accepting new invocations; in-flight runs continue.",
  },
  agent_delisted: {
    zhHans: "该 Agent 已下架，无法继续调用。",
    zhHant: "該 Agent 已下架，無法繼續呼叫。",
    en: "This agent has been delisted and cannot be invoked.",
  },
  /** E-24: 待平台审核通过前不可被消费者调用 */
  agent_pending_review: {
    zhHans: "该 Agent 尚在审核中，通过审核后方可被用户调用。",
    zhHant: "該 Agent 尚在審核中，通過審核後方可被使用者呼叫。",
    en: "This agent is pending platform review and cannot be invoked until approved.",
  },
  /** E-24: 审核未通过 */
  agent_registration_rejected: {
    zhHans: "该 Agent 未通过上架审核；请根据反馈修改后重新提交。",
    zhHant: "該 Agent 未通過上架審核；請根據回饋修改後重新提交。",
    en: "This agent was not approved for listing; update and resubmit for review.",
  },
  /** E-20: desktop Connector 文件操作 */
  desktop_file_read_allow: {
    zhHans: "桌面连接器读取/列出文件已通过策略评估（中等风险）。",
    zhHant: "桌面連接器讀取／列出檔案已通過策略評估（中等風險）。",
    en: "Desktop connector read/list was evaluated as medium risk and allowed.",
  },
  desktop_write_new_prefix_requires_confirmation: {
    zhHans: "首次向新目录前缀写入需要您在 Web 端确认后再执行。",
    zhHant: "首次向新目錄前綴寫入需要您在 Web 端確認後再執行。",
    en: "First write under a new path prefix requires confirmation in the web app before execution.",
  },
  desktop_write_known_prefix_allow: {
    zhHans: "在已使用过的路径前缀内写入已通过策略评估（中等风险）。",
    zhHant: "在已使用過的路徑前綴內寫入已通過策略評估（中等風險）。",
    en: "Write within a previously used path prefix is medium risk and allowed.",
  },
  /** E-38: `hub_badge_profile` availability / risk primary reasons (V1.6 Trust SSOT hooks) */
  hub_default_ready_official: {
    zhHans: "平台官方来源且审核语义满足默认可用条件。",
    zhHant: "平台官方來源且審核語意滿足預設可用條件。",
    en: "Platform-official origin meets default-availability policy.",
  },
  hub_default_ready_node: {
    zhHans: "受信节点注册来源且信誉与审核组合满足默认可用条件。",
    zhHant: "受信節點註冊來源且信譽與審核組合滿足預設可用條件。",
    en: "Registered node origin meets default availability under policy.",
  },
  hub_default_ready_provider: {
    zhHans: "Provider 来源、标准审核通过与较高信誉档，默认可用。",
    zhHant: "Provider 來源、標準審核通過與較高信譽檔，預設可用。",
    en: "Provider origin with standard approval and strong reputation tier.",
  },
  hub_default_ready_provider_strong_audit: {
    zhHans: "Provider 在加强审核下满足默认可用（含信誉 C 档补偿路径）。",
    zhHant: "Provider 在加強審核下滿足預設可用（含信譽 C 檔補償路徑）。",
    en: "Provider meets default availability with strengthened audit (incl. grade C path).",
  },
  hub_conditional_audit_conditions: {
    zhHans: "审核为附条件通过；调用可能受额外策略约束。",
    zhHant: "審核為附條件通過；呼叫可能受額外策略約束。",
    en: "Approved with conditions; invocations may be subject to extra policy.",
  },
  hub_conditional_reputation_tier_c: {
    zhHans: "信誉 C 档：默认可用需更强审核或更高信号，当前为条件可用。",
    zhHant: "信譽 C 檔：預設可用需更強審核或更高訊號，目前為條件可用。",
    en: "Reputation grade C: default availability requires stronger audit; shown as conditional.",
  },
  hub_not_ready_publication_status: {
    zhHans: "上架/审核状态不允许作为公开目录默认可用条目。",
    zhHant: "上架／審核狀態不允許作為公開目錄預設可用條目。",
    en: "Publication/review state is not eligible for default public-directory availability.",
  },
  hub_not_ready_identity: {
    zhHans: "身份或绑定未达平台验证要求。",
    zhHant: "身分或綁定未達平台驗證要求。",
    en: "Identity or binding does not meet platform verification requirements.",
  },
  hub_not_ready_reputation_floor: {
    zhHans: "信誉低于平台默认可用下限。",
    zhHant: "信譽低於平台預設可用下限。",
    en: "Reputation is below the platform floor for default availability.",
  },
  hub_not_ready_audit_pending: {
    zhHans: "审核尚未完成。",
    zhHant: "審核尚未完成。",
    en: "Audit/review is not complete yet.",
  },
  hub_not_ready_audit_rejected: {
    zhHans: "审核未通过，不得按默认可用展示。",
    zhHant: "審核未通過，不得按預設可用展示。",
    en: "Review rejected; not eligible for default availability presentation.",
  },
  hub_not_ready_changes_requested: {
    zhHans: "需按审核意见修改后再提交。",
    zhHant: "需按審核意見修改後再提交。",
    en: "Changes requested by review; resubmit after fixes.",
  },
  hub_not_ready_source_unattributed: {
    zhHans: "来源类别无法归类为受信官方/节点/Provider。",
    zhHant: "來源類別無法歸類為受信官方／節點／Provider。",
    en: "Origin cannot be classified as trusted official, node, or provider.",
  },
  hub_not_ready_unspecified: {
    zhHans: "当前策略下无法给出默认可用分类（请联系支持）。",
    zhHant: "目前策略下無法給出預設可用分類（請聯絡支援）。",
    en: "Default availability cannot be classified under current policy (contact support).",
  },
  hub_risk_low_capabilities: {
    zhHans: "声明能力风险为低。",
    zhHant: "聲明能力風險為低。",
    en: "Declared capability risk is low.",
  },
  hub_risk_sensitive_capabilities: {
    zhHans: "声明或审核校正后的能力风险包含中高敏档位。",
    zhHant: "聲明或審核校正後的能力風險包含中高敏檔位。",
    en: "Declared or review-adjusted capability risk includes elevated sensitivity.",
  },
  hub_risk_reviewed_max_applied: {
    zhHans: "已应用审核认可的最大风险档参与计算。",
    zhHant: "已套用審核認可的最大風險檔參與計算。",
    en: "Reviewed maximum risk tier was applied in the risk signal.",
  },
  /** E-42: Provider 协议升级 / 复检失败项（与 agents.failed_check_ids 对齐） */
  a2a_interface_drift: {
    zhHans: "检测到 Agent Card / 选中 interface 与平台备案不一致，请提交复检。",
    zhHant: "偵測到 Agent Card／選中 interface 與平台備案不一致，請提交複檢。",
    en: "The agent card or selected interface changed vs the platform baseline; please submit for recheck.",
  },
  a2a_compat_grace_expired: {
    zhHans: "兼容路径（compat）宽限期已结束，请升级到 A2A 1.0.0 正式 Card 并提交复检。",
    zhHant: "相容路徑（compat）寬限期已結束，請升級到 A2A 1.0.0 正式 Card 並提交複檢。",
    en: "The compatibility grace period has ended; upgrade to a full A2A 1.0.0 agent card and submit for recheck.",
  },
  /** E-107 CTO V1.7.2：google_a2a_v1 SendMessage 须返回合规 `result.task`，禁止仅以 `result.message` 冒充终局完成态 */
  a2a_response_missing_task: {
    zhHans:
      "该 Agent 对 SendMessage 的响应不符合 Task-only（缺少合规 result.task）。请 Provider 返回带 status.state 的 Task。",
    zhHant:
      "該 Agent 對 SendMessage 的回應不符合 Task-only（缺少合規 result.task）。請 Provider 回傳帶 status.state 的 Task。",
    en: "SendMessage response is not Task-compliant (missing a proper result.task with status.state).",
  },
  /** E-49.1 V1.6.2.1: 产品面仅参与者可见 */
  conversation_not_participant: {
    zhHans: "你不是该会话的参与者，无法查看或操作此会话。",
    zhHant: "你不是該會話的參與者，無法檢視或操作此會話。",
    en: "You are not a participant in this conversation and cannot access it.",
  },
  /** E-49.1: 加入会话时目标 Agent 不在 H-1（active + listed） */
  peer_not_in_consumer_hub: {
    zhHans: "目标 Agent 不在消费者主池（须为已上架且可用），无法加入会话。",
    zhHant: "目標 Agent 不在消費者主池（須為已上架且可用），無法加入會話。",
    en: "The target agent is not in the consumer hub pool (must be active and listed).",
  },
  /** E-52 V1.6.2.1：拉 Agent 前须已有人类 participant（禁止 Agent-only 产品路径） */
  conversation_requires_human_participant: {
    zhHans: "会话中须至少有一名人类参与者后，才能邀请其他 Agent。",
    zhHant: "會話中須至少有一名人類參與者後，才能邀請其他 Agent。",
    en: "At least one human participant must be in the conversation before inviting more agents.",
  },
  /** E-52：受信 Agent 代拉 Peer 时调用方须已在会话中 */
  agent_invite_caller_not_participant: {
    zhHans: "调用方 Agent 须已是该会话参与者，方可发起邀请。",
    zhHant: "呼叫方 Agent 須已是該會話參與者，方可發起邀請。",
    en: "The calling agent must already be a participant in this conversation to invite others.",
  },
  /**
   * W-61.3 / CTO v2.2 文档别名：与 `mandate_caller_missing` / `mandate_peer_missing` 等并列时作统一展示键（主线亦可直出）。
   */
  mandate_missing_or_invalid: {
    zhHans: "当前授权不足，无法邀请该 Agent。",
    zhHant: "目前授權不足，無法邀請該 Agent。",
    en: "Authorization is insufficient to invite this agent.",
  },
  /** W-61.3 文档别名：与 `peer_not_in_consumer_hub` 等价语义 */
  peer_agent_not_h1: {
    zhHans: "该 Agent 当前不可被邀请协作（须为消费者主池 H-1）。",
    zhHant: "該 Agent 目前不可被邀請協作（須為消費者主池 H-1）。",
    en: "This agent cannot be invited for collaboration right now (consumer hub H-1 required).",
  },
  /** W-61.3 文档别名：与 `conversation_not_participant` 等价语义 */
  conversation_participant_required: {
    zhHans: "你不是该会话参与者，无法执行此操作。",
    zhHant: "你不是該會話參與者，無法執行此操作。",
    en: "You are not a participant in this conversation.",
  },
  /** W-61.3 文档别名：与 `mandate_owner_invite_not_allowed` 等价语义（属主未授权 Agent 拉本人） */
  agent_owner_invite_not_allowed: {
    zhHans: "未授权该 Agent 将您拉入此会话。",
    zhHant: "未授權該 Agent 將您拉入此會話。",
    en: "You have not allowed this agent to add you to this conversation.",
  },
  /** E-49.1: Agent 拉属主时 Agent 无 owner 绑定 */
  agent_owner_required_for_owner_invite: {
    zhHans: "该 Agent 未绑定属主用户，无法通过代拉路径加入用户。",
    zhHant: "該 Agent 未綁定屬主使用者，無法透過代拉路徑加入使用者。",
    en: "This agent has no bound owner user; owner invite via agent is not allowed.",
  },
  /** E-50 V1.6.2.1: 好友 / 拉黑 / 冷却 / 深链 */
  friendship_blocked: {
    zhHans: "双方存在拉黑关系，无法发送好友申请。",
    zhHant: "雙方存在拉黑關係，無法發送好友申請。",
    en: "A block exists between these accounts; friend requests are not allowed.",
  },
  friendship_reject_cooldown: {
    zhHans: "对方曾拒绝申请，在冷却期内无法再次发送。",
    zhHant: "對方曾拒絕申請，在冷卻期內無法再次發送。",
    en: "A recent decline is still in cooldown; try again later.",
  },
  friendship_rate_limited: {
    zhHans: "今日好友申请已达上限，请明日再试。",
    zhHant: "今日好友申請已達上限，請明日再試。",
    en: "Daily friend request limit reached; try again tomorrow.",
  },
  friendship_invite_used: {
    zhHans: "该邀请链接已使用，请让对方重新生成。",
    zhHant: "該邀請連結已使用，請讓對方重新產生。",
    en: "This invite link was already used; ask for a new one.",
  },
  friendship_invite_expired: {
    zhHans: "邀请链接已过期，请让对方重新生成。",
    zhHant: "邀請連結已過期，請讓對方重新產生。",
    en: "This invite link has expired; ask for a new one.",
  },
  /** E-51 V1.6.2.1: Mandate 双边 / Space A+B */
  mandate_caller_missing: {
    zhHans: "发起侧缺少有效 Mandate，无法将对方 Agent 拉入会话。",
    zhHant: "發起側缺少有效 Mandate，無法將對方 Agent 拉入會話。",
    en: "No valid mandate on the caller side; the peer agent cannot be added.",
  },
  mandate_peer_missing: {
    zhHans: "对方 Agent 的属主尚未提供有效 Mandate。",
    zhHant: "對方 Agent 的屬主尚未提供有效 Mandate。",
    en: "The peer agent’s owner does not have a valid mandate recorded.",
  },
  mandate_peer_owner_required: {
    zhHans: "目标 Agent 无属主绑定，无法完成 Mandate 校验。",
    zhHant: "目標 Agent 無屬主綁定，無法完成 Mandate 校驗。",
    en: "The target agent has no owner; mandate validation cannot complete.",
  },
  mandate_space_mismatch: {
    zhHans: "Mandate 绑定的 Space 与会话不一致。",
    zhHant: "Mandate 綁定的 Space 與會話不一致。",
    en: "The mandate’s space does not match this conversation’s space.",
  },
  mandate_space_membership_required: {
    zhHans: "须在会话所属 Space 内具备成员身份才能完成该协作授权。",
    zhHant: "須在會話所屬 Space 內具備成員身分才能完成該協作授權。",
    en: "Space membership is required to satisfy this collaborative mandate.",
  },
  mandate_cross_user_requires_space: {
    zhHans: "跨用户双边授权须绑定同一 Space 会话。",
    zhHant: "跨使用者雙邊授權須綁定同一 Space 會話。",
    en: "Cross-user bilateral mandates require a space-bound conversation.",
  },
  mandate_caller_agent_unresolved: {
    zhHans: "会话中未找到你属主且已参与的 Agent，无法作为发起侧。",
    zhHant: "會話中未找到你屬主且已參與的 Agent，無法作為發起側。",
    en: "No participating agent you own was found to act as the mandate caller.",
  },
  mandate_caller_agent_ambiguous: {
    zhHans: "会话中有多个你属主的 Agent，请在请求中指定 caller_agent_id。",
    zhHant: "會話中有多個你屬主的 Agent，請在請求中指定 caller_agent_id。",
    en: "Multiple agents you own are in this conversation; pass caller_agent_id.",
  },
  mandate_caller_agent_forbidden: {
    zhHans: "指定的 caller_agent_id 非你属主或未参与本会话。",
    zhHant: "指定的 caller_agent_id 非你屬主或未參與本會話。",
    en: "The caller_agent_id is not your owned agent in this conversation.",
  },
  mandate_caller_mismatch: {
    zhHans: "发起侧 Mandate 与用户或 Agent 不一致。",
    zhHant: "發起側 Mandate 與使用者或 Agent 不一致。",
    en: "Caller mandate does not match the user or agent.",
  },
  mandate_peer_mismatch: {
    zhHans: "对方 Mandate 与属主或 Agent 不一致。",
    zhHant: "對方 Mandate 與屬主或 Agent 不一致。",
    en: "Peer mandate does not match the owner or agent.",
  },
  mandate_owner_invite_not_allowed: {
    zhHans: "未在 Mandate 中允许该 Agent 将您拉入会话。",
    zhHant: "未在 Mandate 中允許該 Agent 將您拉入會話。",
    en: "Your mandate does not allow this agent to add you to the conversation.",
  },
  /** E-52 / W-61：属主入会邀请与当前会话 URL 不一致、邀请不存在或已失效 */
  owner_join_invite_not_found: {
    zhHans: "该邀请与当前会话不匹配、已失效或不存在；请从最新通知重新打开，勿跨会话使用同一链接。",
    zhHant: "該邀請與目前會話不相符、已失效或不存在；請從最新通知重新開啟，勿跨會話使用同一連結。",
    en: "This invite does not match this conversation, expired, or does not exist. Open the latest notification link—do not reuse it across threads.",
  },
  owner_join_invite_not_pending: {
    zhHans: "该邀请已处理过，无法接受或重复操作。",
    zhHant: "該邀請已處理過，無法接受或重複操作。",
    en: "This invite was already handled and cannot be accepted again.",
  },
  /**
   * E-52 / W-61：属主在 UI 拒绝「Agent 拉本人入会」邀请后的审计 reason（与 `ChatOwnerJoinInviteBanner` 追溯行对齐）。
   */
  "conversation.owner_join_invite_declined": {
    zhHans: "你已拒绝由 Agent 发起的属主入会邀请；会话参与者名单未变更。",
    zhHant: "你已拒絕由 Agent 發起的屬主入會邀請；會話參與者名單未變更。",
    en: "You declined the owner join invite from your agent; participant membership was not changed.",
  },
  /** 主线会话不存在或无权访问时与属主邀请 accept 等路径共用 code */
  conversation_not_found: {
    zhHans: "未找到该会话或你无权访问；请确认链接来自最新通知。",
    zhHant: "找不到該會話或你無權存取；請確認連結來自最新通知。",
    en: "Conversation not found or not accessible; confirm the link is from your latest notification.",
  },
  /** V1.7.1 W-102：子会话在父下不存在或父子不匹配（主线仅 `error.code`，无 `details.reason_code`） */
  subconversation_not_found: {
    zhHans: "在父会话下未找到该子会话，或子会话与父会话不匹配。",
    zhHant: "在父會話下未找到該子會話，或子會話與父會話不相符。",
    en: "Subconversation not found under this parent, or the child does not belong to the parent.",
  },
  /** W-62 V1.8：Invocation 锚点协作 / 子会话策略与校验 */
  agent_not_in_parent_conversation: {
    zhHans: "调用方 Agent 必须先加入父会话，才能创建子会话或邀请外部调用者。",
    zhHant: "呼叫方 Agent 必須先加入父會話，才能建立子會話或邀請外部呼叫者。",
    en: "The calling agent must already be in the parent conversation before creating child threads or inviting external callers.",
  },
  initiator_agent_not_in_parent: {
    zhHans: "你选择的发起 Agent 不在父会话中，无法用于创建子会话。",
    zhHant: "你選擇的發起 Agent 不在父會話中，無法用於建立子會話。",
    en: "The selected initiator agent is not in the parent conversation and cannot create a child thread.",
  },
  agent_initiator_mismatch: {
    zhHans: "受信 Agent 仅可代表自己创建子会话，不能代替其他 Agent 发起。",
    zhHant: "受信 Agent 僅可代表自己建立子會話，不能替其他 Agent 發起。",
    en: "A trusted agent can only create child conversations as itself, not on behalf of another agent.",
  },
  child_invite_mode_single_requires_one_agent: {
    zhHans: "当前策略为单 Agent 邀请模式，每个子会话只能选择一个外部 Agent。",
    zhHant: "目前策略為單 Agent 邀請模式，每個子會話只能選擇一個外部 Agent。",
    en: "Current policy is single-external-agent mode; each child conversation can include only one external agent.",
  },
  child_create_requires_owner_or_manager: {
    zhHans: "当前策略下，仅主会话所有者或管理者可以创建子会话。",
    zhHant: "目前策略下，僅主會話所有者或管理者可以建立子會話。",
    en: "Under current policy, only the parent conversation owner or managers can create child conversations.",
  },
  child_create_requires_human_participant: {
    zhHans: "当前策略要求创建者必须是该会话中的人类参与者。",
    zhHant: "目前策略要求建立者必須是該會話中的人類參與者。",
    en: "Current policy requires the creator to be a human participant in this conversation.",
  },
  child_create_policy_agent_only: {
    zhHans: "当前策略仅允许 Agent 侧发起创建子会话。",
    zhHant: "目前策略僅允許 Agent 端發起建立子會話。",
    en: "Current policy allows only agent-side actors to create child conversations.",
  },
  child_create_requires_manager_approval: {
    zhHans: "当前策略要求管理者确认后，Agent 才能创建子会话。",
    zhHant: "目前策略要求管理者確認後，Agent 才能建立子會話。",
    en: "Current policy requires manager approval before an agent can create a child conversation.",
  },
  child_create_agent_not_allowed: {
    zhHans: "该 Agent 不在允许创建子会话的名单中。",
    zhHant: "該 Agent 不在允許建立子會話的名單中。",
    en: "This agent is not allowed by policy to create child conversations.",
  },
  child_create_policy_user_only: {
    zhHans: "当前策略仅允许人类账号侧创建子会话。",
    zhHant: "目前策略僅允許人類帳號端建立子會話。",
    en: "Current policy allows only human accounts to create child conversations.",
  },
  external_caller_invite_requires_manager: {
    zhHans: "当前策略要求由会话管理者（或指定管理者）邀请外部调用者入会。",
    zhHant: "目前策略要求由會話管理者（或指定管理者）邀請外部呼叫者入會。",
    en: "Current policy requires a manager (or designated manager) to invite an external caller.",
  },
  external_caller_invite_requires_manager_approval: {
    zhHans: "当前策略下，Agent 邀请外部调用者需要管理者确认。",
    zhHant: "目前策略下，Agent 邀請外部呼叫者需要管理者確認。",
    en: "Under current policy, an agent needs manager approval to invite an external caller.",
  },
  source_invocation_unavailable: {
    zhHans: "目标调用实例不存在或已结束，当前不可用于协作邀请。",
    zhHant: "目標呼叫實例不存在或已結束，目前不可用於協作邀請。",
    en: "The source invocation does not exist or is completed, so it cannot be used for collaboration invites.",
  },
  source_invocation_not_invitable_online: {
    zhHans: "目标调用实例当前不满足“在线且可邀请且未撤销”条件。",
    zhHant: "目標呼叫實例目前不符合「在線且可邀請且未撤銷」條件。",
    en: "The source invocation is not currently online, invitable, and active (not revoked).",
  },
  source_invocation_agent_mismatch: {
    zhHans: "若声明 invited_agent_ids，则必须包含 source invocation 对应的 Agent。",
    zhHant: "若聲明 invited_agent_ids，則必須包含 source invocation 對應的 Agent。",
    en: "If you pass invited_agent_ids, it must include the agent bound to the source invocation.",
  },
  /** E-113 V1.7.4：浏览器用户路径禁止手工指定被邀 Agent B */
  invited_agents_forbidden_for_user_actor: {
    zhHans: "用户侧不能手工指定被邀 Agent；被邀方仅可由 source invocation 解析。",
    zhHant: "用戶端不能手工指定被邀 Agent；被邀方僅可由 source invocation 解析。",
    en: "Human clients cannot specify invited agents; the invitee is derived only from the source invocation.",
  },
  user_subconversation_requires_source_invocation: {
    zhHans: "创建子会话须提供有效的 source invocation 锚点。",
    zhHant: "建立子會話須提供有效的 source invocation 錨點。",
    en: "Creating a child conversation requires a valid source invocation anchor.",
  },
  /** 受信 Agent 无 source 时须显式传 invited_agent_ids */
  invited_agent_ids_required: {
    zhHans: "未提供 source invocation 时，须在 invited_agent_ids 中声明被邀 Agent。",
    zhHant: "未提供 source invocation 時，須在 invited_agent_ids 中聲明被邀 Agent。",
    en: "Without a source invocation, invited_agent_ids must name the agents to invite.",
  },
  invocation_invite_tag_requires_requester: {
    zhHans: "仅该调用实例的调用者本人可以查看或修改此邀请标签。",
    zhHant: "僅該呼叫實例的呼叫者本人可以檢視或修改此邀請標籤。",
    en: "Only the invocation requester can view or update this invite tag.",
  },
  invocation_completed_not_invitable: {
    zhHans: "该调用已结束，不能再标记为“可被 Agent 邀请”。",
    zhHant: "該呼叫已結束，不能再標記為「可被 Agent 邀請」。",
    en: "This invocation is completed and can no longer be marked invitable by agents.",
  },
  agent_not_in_conversation_for_discovery: {
    zhHans: "调用方 Agent 必须先在会话中，才能基于该会话执行在线实例发现。",
    zhHant: "呼叫方 Agent 必須先在會話中，才能基於該會話執行在線實例發現。",
    en: "The calling agent must already be in the conversation before running discovery scoped to that conversation.",
  },
};

/**
 * Normalize `user_facing_message` from persisted audit/API JSON.
 * Current: `{ zhHans, zhHant, en }`.
 * Legacy: `{ zh, en, ja? }` — map to zhHans/zhHant/en (zhHant mirrors zh; old `ja` was not product Traditional Chinese).
 */
export function normalizeUserFacingLocaleBundle(raw: unknown): UserFacingLocaleBundle | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.zhHans === "string" &&
    typeof o.zhHant === "string" &&
    typeof o.en === "string"
  ) {
    return { zhHans: o.zhHans, zhHant: o.zhHant, en: o.en };
  }
  const zh = o.zh;
  const en = o.en;
  if (typeof zh === "string" && typeof en === "string") {
    return { zhHans: zh, zhHant: zh, en };
  }
  return null;
}

export const buildUserFacingMessageFromReasonCodes = (reasonCodes: string[]): UserFacingLocaleBundle => {
  const codes = reasonCodes.filter(Boolean);
  if (codes.length === 0) {
    return UNKNOWN;
  }
  const bundles = codes
    .map((c) => REASON_CODE_USER_FACING[c] ?? UNKNOWN)
    .filter(Boolean);
  if (bundles.length === 1) {
    return bundles[0]!;
  }
  const zhHans = bundles.map((b) => b.zhHans).join(" ");
  const zhHant = bundles.map((b) => b.zhHant).join(" ");
  const en = bundles.map((b) => b.en).join(" ");
  return { zhHans, zhHant, en };
};
