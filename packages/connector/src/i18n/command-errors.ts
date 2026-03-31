import type { Messages } from "./messages";

export type ParsedCommandError = { code: string; detail?: string };

export function tryParseCommandErrorJson(raw: string): ParsedCommandError | null {
  const t = raw.trim();
  if (!t.startsWith("{")) return null;
  try {
    const o = JSON.parse(t) as unknown;
    if (!o || typeof o !== "object") return null;
    const rec = o as Record<string, unknown>;
    if (typeof rec.code !== "string") return null;
    const detail = typeof rec.detail === "string" ? rec.detail : undefined;
    return { code: rec.code, detail };
  } catch {
    return null;
  }
}

/** Tauri `invoke` 抛错时，优先取 `Error.message`（常见为 Rust 侧 JSON 字符串）。 */
export function extractInvokeErrorString(e: unknown): string {
  if (typeof e === "string") return e;
  if (e instanceof Error && typeof e.message === "string") return e.message;
  if (
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    return (e as { message: string }).message;
  }
  return String(e);
}

export function parseCommandErrorFromInvoke(e: unknown): ParsedCommandError | null {
  return tryParseCommandErrorJson(extractInvokeErrorString(e));
}

export function formatParsedCommandError(m: Messages, p: ParsedCommandError): string {
  switch (p.code) {
    case "MOUNT_LIMIT_REACHED":
      return m.errMountLimit;
    case "CONFIG_SAVE_FAILED":
      return m.errCommandConfigSave(p.detail ?? "");
    case "DIALOG_TASK_FAILED":
      return m.errCommandDialog(p.detail ?? "");
    case "PATH_RESOLVE_FAILED":
      return m.errCommandPathResolve(p.detail ?? "");
    default:
      return m.errCommandUnknown(p.code, p.detail);
  }
}

export function formatInvokeErrorForDisplay(e: unknown, m: Messages): string {
  const parsed = parseCommandErrorFromInvoke(e);
  if (parsed) return formatParsedCommandError(m, parsed);
  return m.errRawFallback(extractInvokeErrorString(e));
}
