export const SUPPORTED_LOCALES = ["en", "zh-Hant", "zh-Hans"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

/** 与官网 `packages/website/src/lib/i18n/locales.ts` 对齐 */
export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) {
    return DEFAULT_LOCALE;
  }
  if (isSupportedLocale(value)) {
    return value;
  }
  const lower = value.toLowerCase();
  if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower.startsWith("zh-mo")) {
    return "zh-Hant";
  }
  if (lower.startsWith("zh")) {
    return "zh-Hans";
  }
  return DEFAULT_LOCALE;
}

const STORAGE_KEY = "gaialynk.connector.locale";

export function getStoredLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return isSupportedLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function resolveInitialLocale(): Locale {
  const stored = getStoredLocale();
  if (stored) return stored;
  if (typeof navigator !== "undefined" && navigator.language) {
    return normalizeLocale(navigator.language);
  }
  return DEFAULT_LOCALE;
}
