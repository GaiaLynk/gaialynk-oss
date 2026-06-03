import { describe, expect, it } from "vitest";
import { getMessages, normalizeLocale, SUPPORTED_LOCALES } from "../src/i18n";

describe("connector i18n locales", () => {
  it("normalizes BCP-47 like website", () => {
    expect(normalizeLocale("zh-CN")).toBe("zh-Hans");
    expect(normalizeLocale("zh-TW")).toBe("zh-Hant");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("fr")).toBe("en");
  });

  it("exposes non-empty titles for every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const m = getMessages(loc);
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.documentTitle.length).toBeGreaterThan(0);
      expect(m.subtitle.length).toBeGreaterThan(0);
      expect(m.copyCodeSuccess.length).toBeGreaterThan(0);
      expect(m.sectionAdvanced.length).toBeGreaterThan(0);
      expect(m.savedWithUrl("https://example.com")).toContain("example.com");
      expect(m.errMountLimit.length).toBeGreaterThan(0);
      expect(m.btnCheckUpdates.length).toBeGreaterThan(0);
    }
  });
});
