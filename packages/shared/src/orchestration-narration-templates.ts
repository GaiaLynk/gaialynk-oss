/**
 * E-117 (V1.7.5): 编排叙事纯模板文案（en / zh-Hans / zh-Hant），由服务端渲染，不调用 LLM。
 */
export type OrchestrationNarrationLocale = "en" | "zh-Hans" | "zh-Hant";

export type OrchestrationNarrationKind =
  | "orchestration_start"
  | "step_start"
  | "step_handoff"
  | "orchestration_complete"
  | "step_error";

export interface OrchestrationNarrationTemplatesForLocale {
  orchestration_start_full: string;
  orchestration_start_degraded: string;
  step_start_full: string;
  step_start_degraded: string;
  step_handoff_full: string;
  step_handoff_degraded: string;
  orchestration_complete: string;
  step_error_full: string;
  step_error_degraded: string;
}

export const ORCHESTRATION_NARRATION_TEMPLATES: Record<
  OrchestrationNarrationLocale,
  OrchestrationNarrationTemplatesForLocale
> = {
  "zh-Hans": {
    orchestration_start_full:
      "🎯 收到需求，正在为你安排 {{step_count}} 位专家接力完成：{{relay_narrative}}",
    orchestration_start_degraded: "🎯 正在安排 {{step_count}} 位 Agent 接力完成你的需求...",
    step_start_full: "▶️ 第 {{n}} 步：{{agent_name}} 正在{{subtask_description}}...",
    step_start_degraded: "▶️ 第 {{n}} 步：{{agent_name}} 正在执行本步任务...",
    step_handoff_full:
      "✅ {{agent_name}} 已完成{{subtask_description}}，正在将结果交给 {{next_agent_name}}...",
    step_handoff_degraded: "✅ {{agent_name}} 已完成第 {{n}} 步，交给 {{next_agent_name}} 继续...",
    orchestration_complete: "🎉 全部 {{step_count}} 步已完成！{{relay_narrative_summary}}",
    step_error_full:
      "⚠️ {{agent_name}} 在{{subtask_description}}时遇到问题：{{error_readable}}。你可以重试或换一个专家。",
    step_error_degraded:
      "⚠️ {{agent_name}} 在第 {{n}} 步遇到问题：{{error_readable}}。你可以重试或换一个专家。",
  },
  "zh-Hant": {
    orchestration_start_full:
      "🎯 收到需求，正在為你安排 {{step_count}} 位專家接力完成：{{relay_narrative}}",
    orchestration_start_degraded: "🎯 正在安排 {{step_count}} 位 Agent 接力完成你的需求...",
    step_start_full: "▶️ 第 {{n}} 步：{{agent_name}} 正在{{subtask_description}}...",
    step_start_degraded: "▶️ 第 {{n}} 步：{{agent_name}} 正在執行本步任務...",
    step_handoff_full:
      "✅ {{agent_name}} 已完成{{subtask_description}}，正在將結果交給 {{next_agent_name}}...",
    step_handoff_degraded: "✅ {{agent_name}} 已完成第 {{n}} 步，交給 {{next_agent_name}} 繼續...",
    orchestration_complete: "🎉 全部 {{step_count}} 步已完成！{{relay_narrative_summary}}",
    step_error_full:
      "⚠️ {{agent_name}} 在{{subtask_description}}時遇到問題：{{error_readable}}。你可以重試或換一位專家。",
    step_error_degraded:
      "⚠️ {{agent_name}} 在第 {{n}} 步遇到問題：{{error_readable}}。你可以重試或換一位專家。",
  },
  en: {
    orchestration_start_full:
      "🎯 Got it — lining up {{step_count}} experts to hand this off: {{relay_narrative}}",
    orchestration_start_degraded:
      "🎯 Lining up {{step_count}} agents to complete your request...",
    step_start_full: "▶️ Step {{n}}: {{agent_name}} is {{subtask_description}}...",
    step_start_degraded: "▶️ Step {{n}}: {{agent_name}} is working on this step...",
    step_handoff_full:
      "✅ {{agent_name}} finished {{subtask_description}} and is passing results to {{next_agent_name}}...",
    step_handoff_degraded:
      "✅ {{agent_name}} finished step {{n}} — handing off to {{next_agent_name}}...",
    orchestration_complete: "🎉 All {{step_count}} steps done! {{relay_narrative_summary}}",
    step_error_full:
      "⚠️ {{agent_name}} ran into an issue while {{subtask_description}}: {{error_readable}}. You can retry or pick another expert.",
    step_error_degraded:
      "⚠️ {{agent_name}} ran into an issue on step {{n}}: {{error_readable}}. You can retry or pick another expert.",
  },
};
