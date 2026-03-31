import { describe, expect, it } from "vitest";
import {
  formatInvokeErrorForDisplay,
  formatParsedCommandError,
  parseCommandErrorFromInvoke,
  tryParseCommandErrorJson,
} from "../src/i18n/command-errors";
import { getMessages } from "../src/i18n/messages";

describe("command-errors", () => {
  it("parses JSON error payload", () => {
    const j = '{"code":"MOUNT_LIMIT_REACHED"}';
    expect(tryParseCommandErrorJson(j)).toEqual({ code: "MOUNT_LIMIT_REACHED" });
    expect(tryParseCommandErrorJson('{"code":"CONFIG_SAVE_FAILED","detail":"disk full"}')).toEqual({
      code: "CONFIG_SAVE_FAILED",
      detail: "disk full",
    });
  });

  it("maps codes to zh-Hans", () => {
    const m = getMessages("zh-Hans");
    expect(
      formatParsedCommandError(m, { code: "MOUNT_LIMIT_REACHED" }),
    ).toContain("5");
    expect(formatParsedCommandError(m, { code: "CONFIG_SAVE_FAILED", detail: "x" })).toContain(
      "保存",
    );
  });

  it("formats invoke-shaped errors", () => {
    const m = getMessages("en");
    const err = { message: '{"code":"MOUNT_LIMIT_REACHED"}' };
    expect(formatInvokeErrorForDisplay(err, m)).toBe(m.errMountLimit);
  });

  it("falls back to raw message when not JSON", () => {
    const m = getMessages("en");
    expect(formatInvokeErrorForDisplay("plain failure", m)).toBe("plain failure");
  });

  it("parseCommandErrorFromInvoke handles Error", () => {
    expect(
      parseCommandErrorFromInvoke(
        new Error('{"code":"PATH_RESOLVE_FAILED","detail":"bad"}'),
      )?.code,
    ).toBe("PATH_RESOLVE_FAILED");
  });
});
