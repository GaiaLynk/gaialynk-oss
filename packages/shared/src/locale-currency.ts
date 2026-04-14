/**
 * 消费者侧计费与展示：**仅 USD**（不按 UI locale / 地理推断币种，避免「简体用户在美国」等错位）。
 * Provider 内部部分列名仍含 `_cny` 历史后缀时，新产品语义上以 **USD 金额** 为准，迁移见运维文档。
 */
export const PLATFORM_BILLING_CURRENCY = "USD" as const;
export type BillingMarketCurrency = typeof PLATFORM_BILLING_CURRENCY;

/** @deprecated 保留签名供旧调用点；始终返回 USD。 */
export function defaultListingCurrencyFromMarketingLocale(_locale?: string | null): BillingMarketCurrency {
  return PLATFORM_BILLING_CURRENCY;
}

/** @deprecated 保留签名；始终返回 USD。 */
export function preferredWalletCurrencyFromRequestHeaders(
  _xGaiaLynkLocale?: string | null,
  _acceptLanguage?: string | null,
): BillingMarketCurrency {
  return PLATFORM_BILLING_CURRENCY;
}
