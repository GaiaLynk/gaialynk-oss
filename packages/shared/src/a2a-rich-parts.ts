/**
 * E-1763-C (V1.7.6.3): A2A Rich Part（DataPart / FilePart）会话结构化附件契约。
 */

/** 无文本正文、仅有 Rich Part 时的 Agent 回复占位（官网 W-1763-C 可对齐）。 */
export const A2A_RICH_PART_ONLY_PLACEHOLDER =
  "Agent 返回了结构化结果（无文本正文）。请查看结构化附件。" as const;

export type A2aDataPartAttachment = {
  kind: "data";
  media_type?: string;
  data: Record<string, unknown>;
  /** 供列表/摘要展示的可读 JSON 片段（非完整载荷）。 */
  summary?: string;
};

export type A2aFilePartAttachment = {
  kind: "file";
  name?: string;
  mime_type?: string;
  url?: string;
  ref_type?: "url" | "inline_bytes" | "unknown";
};

export type A2aStructuredAttachments = {
  data_parts: A2aDataPartAttachment[];
  file_parts: A2aFilePartAttachment[];
};

export function hasA2aStructuredAttachments(
  attachments: A2aStructuredAttachments | undefined,
): attachments is A2aStructuredAttachments {
  if (!attachments) return false;
  return attachments.data_parts.length > 0 || attachments.file_parts.length > 0;
}
