import type { Locale } from "./locales";

export type Messages = {
  documentTitle: string;
  languageLabel: string;
  langOptionEn: string;
  langOptionZhHans: string;
  langOptionZhHant: string;
  title: string;
  sectionConnection: string;
  statusConnected: string;
  statusWaiting: string;
  hintPairingStuckHtml: string;
  pairingCodeLabelHtml: string;
  btnRegenerateCode: string;
  btnCopyCode: string;
  sectionMainline: string;
  hintMainline: string;
  btnSave: string;
  saving: string;
  savedWithUrl: (url: string) => string;
  saveFailed: (err: string) => string;
  sectionLocalApi: string;
  localApiMutedHtml: string;
  localApiStarting: string;
  sectionMounts: string;
  btnPickDirectory: string;
  btnRemoveMount: string;
  btnCheckUpdates: string;
  updateChecking: string;
  updateUpToDate: (currentVersion: string) => string;
  updateCheckFailed: (detail: string) => string;
  updateAvailable: (newVersion: string, currentVersion: string) => string;
  updateDownloading: string;
  updateDownloadProgress: (downloaded: number, total: number) => string;
  updateDownloadProgressUnknown: (downloadedBytes: number) => string;
  updateInstalling: string;
  errMountLimit: string;
  errMountIndexInvalid: string;
  errCommandConfigSave: (detail: string) => string;
  errCommandDialog: (detail: string) => string;
  errCommandPathResolve: (detail: string) => string;
  errCommandUnknown: (code: string, detail?: string) => string;
  errRawFallback: (raw: string) => string;
};

const en: Messages = {
  documentTitle: "GaiaLynk Desktop Connector",
  languageLabel: "Language",
  langOptionEn: "English",
  langOptionZhHans: "简体中文",
  langOptionZhHant: "繁體中文",
  title: "GaiaLynk Desktop Connector",
  sectionConnection: "Connection",
  statusConnected: "Paired with your account",
  statusWaiting: "Waiting for pairing",
  hintPairingStuckHtml:
    "If you already submitted the code in the web app but stay here, set <strong>mainline API base URL</strong> below (production is usually <code>https://api.gaialynk.com</code>), not the marketing homepage.",
  pairingCodeLabelHtml: "<strong>Pairing code</strong> (6 digits — enter in web Settings → Connectors)",
  btnRegenerateCode: "Regenerate code",
  btnCopyCode: "Copy code",
  sectionMainline: "Mainline URL",
  hintMainline:
    "HTTPS base URL of the mainline API (no trailing slash). Often different from the website you open in the browser.",
  btnSave: "Save",
  saving: "Saving…",
  savedWithUrl: (url) => `Saved: ${url}`,
  saveFailed: (err) => `Save failed: ${err}`,
  sectionLocalApi: "Local API",
  localApiMutedHtml:
    "Listens on 127.0.0.1 only. Requires Bearer <code>device_token</code> and an allowed Origin.",
  localApiStarting: "Starting…",
  sectionMounts: "Mounted workspaces (≤5)",
  btnPickDirectory: "Choose folder…",
  btnRemoveMount: "Remove",
  btnCheckUpdates: "Check for updates",
  updateChecking: "Checking for updates…",
  updateUpToDate: (v) => `You're already on the latest version (${v}).`,
  updateCheckFailed: (detail) =>
    [
      "Update check failed:",
      detail,
      "",
      "Try: open this URL in a browser (same network as this Mac/PC):",
      "https://github.com/GaiaLynk/gaialynk-oss/releases/latest/download/latest.json",
      "",
      "Common causes: offline / proxy / firewall, or signature mismatch after a bad release.",
    ].join("\n"),
  updateAvailable: (newVersion, currentVersion) =>
    `Update available ${newVersion} (current ${currentVersion}). Download and install now?`,
  updateDownloading: "Downloading update…",
  updateDownloadProgress: (downloaded, total) =>
    total > 0
      ? `Downloading update… ${Math.min(100, Math.round((downloaded / total) * 100))}%`
      : "Downloading update…",
  updateDownloadProgressUnknown: (downloadedBytes) =>
    `Downloading update… ${(downloadedBytes / 1048576).toFixed(1)} MiB received`,
  updateInstalling: "Installing update; the app will restart…",
  errMountLimit: "You can mount at most 5 workspace folders.",
  errMountIndexInvalid: "That workspace is no longer in the list. Refresh and try again.",
  errCommandConfigSave: (detail) =>
    detail ? `Could not save settings: ${detail}` : "Could not save settings.",
  errCommandDialog: (detail) =>
    detail ? `Folder picker failed: ${detail}` : "Folder picker failed.",
  errCommandPathResolve: (detail) =>
    detail ? `Could not use the selected folder: ${detail}` : "Could not use the selected folder.",
  errCommandUnknown: (code, detail) =>
    detail && detail.length > 0 ? `Error (${code}): ${detail}` : `Error: ${code}`,
  errRawFallback: (raw) => raw,
};

const zhHans: Messages = {
  documentTitle: "GaiaLynk 桌面 Connector",
  languageLabel: "语言",
  langOptionEn: "English",
  langOptionZhHans: "简体中文",
  langOptionZhHant: "繁體中文",
  title: "GaiaLynk 桌面 Connector",
  sectionConnection: "连接状态",
  statusConnected: "已与账号配对",
  statusWaiting: "等待配对",
  hintPairingStuckHtml:
    "若在 Web 已提交配对码仍停在本页，请确认下方主网为<strong> API 根地址</strong>（生产一般为 <code>https://api.gaialynk.com</code>），勿填官网首页。",
  pairingCodeLabelHtml: "<strong>配对码</strong>（6 位，请在 Web 设置 → 连接器中输入）",
  btnRegenerateCode: "重新生成配对码",
  btnCopyCode: "复制配对码",
  sectionMainline: "主网地址",
  hintMainline: "填写主线 API 的 HTTPS 根（无尾斜杠），与浏览器里打开的官网域名可能不同。",
  btnSave: "保存",
  saving: "正在保存…",
  savedWithUrl: (url) => `已保存：${url}`,
  saveFailed: (err) => `保存失败：${err}`,
  sectionLocalApi: "本机 API",
  localApiMutedHtml: "仅监听 127.0.0.1，需 Bearer <code>device_token</code> + 允许的 Origin。",
  localApiStarting: "启动中…",
  sectionMounts: "已挂载工作区（≤5）",
  btnPickDirectory: "选择目录…",
  btnRemoveMount: "移除",
  btnCheckUpdates: "检查更新",
  updateChecking: "正在检查更新…",
  updateUpToDate: (v) => `当前已是最新版本（${v}）。`,
  updateCheckFailed: (detail) =>
    [
      "检查更新失败：",
      detail,
      "",
      "请尝试在浏览器打开（与本机同一网络）：",
      "https://github.com/GaiaLynk/gaialynk-oss/releases/latest/download/latest.json",
      "",
      "常见原因：离线 / 代理 / 防火墙拦截，或发布端签名与客户端公钥不一致。",
    ].join("\n"),
  updateAvailable: (newVersion, currentVersion) =>
    `发现新版本 ${newVersion}（当前 ${currentVersion}），是否下载并安装？`,
  updateDownloading: "正在下载更新…",
  updateDownloadProgress: (downloaded, total) =>
    total > 0
      ? `正在下载更新… ${Math.min(100, Math.round((downloaded / total) * 100))}%`
      : "正在下载更新…",
  updateDownloadProgressUnknown: (downloadedBytes) =>
    `正在下载更新…已接收 ${(downloadedBytes / 1048576).toFixed(1)} MiB`,
  updateInstalling: "正在安装更新，应用将自动重启…",
  errMountLimit: "最多只能挂载 5 个工作区根目录。",
  errMountIndexInvalid: "该挂载项已不存在，请刷新后再试。",
  errCommandConfigSave: (detail) =>
    detail ? `无法保存设置：${detail}` : "无法保存设置。",
  errCommandDialog: (detail) => (detail ? `选择文件夹失败：${detail}` : "选择文件夹失败。"),
  errCommandPathResolve: (detail) =>
    detail ? `无法解析所选目录：${detail}` : "无法解析所选目录。",
  errCommandUnknown: (code, detail) =>
    detail && detail.length > 0 ? `错误（${code}）：${detail}` : `错误：${code}`,
  errRawFallback: (raw) => raw,
};

const zhHant: Messages = {
  documentTitle: "GaiaLynk 桌面 Connector",
  languageLabel: "語言",
  langOptionEn: "English",
  langOptionZhHans: "简体中文",
  langOptionZhHant: "繁體中文",
  title: "GaiaLynk 桌面 Connector",
  sectionConnection: "連線狀態",
  statusConnected: "已與帳號配對",
  statusWaiting: "等待配對",
  hintPairingStuckHtml:
    "若已在 Web 送出配對碼仍停在本頁，請確認下方主網為<strong> API 根網址</strong>（生產一般為 <code>https://api.gaialynk.com</code>），勿填官網首頁。",
  pairingCodeLabelHtml: "<strong>配對碼</strong>（6 位，請在 Web 設定 → 連接器中輸入）",
  btnRegenerateCode: "重新產生配對碼",
  btnCopyCode: "複製配對碼",
  sectionMainline: "主網地址",
  hintMainline: "填寫主線 API 的 HTTPS 根（無尾斜線），與瀏覽器開啟的官網網域可能不同。",
  btnSave: "儲存",
  saving: "儲存中…",
  savedWithUrl: (url) => `已儲存：${url}`,
  saveFailed: (err) => `儲存失敗：${err}`,
  sectionLocalApi: "本機 API",
  localApiMutedHtml: "僅監聽 127.0.0.1，需 Bearer <code>device_token</code> + 允許的 Origin。",
  localApiStarting: "啟動中…",
  sectionMounts: "已掛載工作區（≤5）",
  btnPickDirectory: "選擇目錄…",
  btnRemoveMount: "移除",
  btnCheckUpdates: "檢查更新",
  updateChecking: "正在檢查更新…",
  updateUpToDate: (v) => `目前已是最新版本（${v}）。`,
  updateCheckFailed: (detail) =>
    [
      "檢查更新失敗：",
      detail,
      "",
      "請在瀏覽器開啟（與本機相同網路）：",
      "https://github.com/GaiaLynk/gaialynk-oss/releases/latest/download/latest.json",
      "",
      "常見原因：離線／代理／防火牆，或發佈端簽章與客戶端公鑰不一致。",
    ].join("\n"),
  updateAvailable: (newVersion, currentVersion) =>
    `發現新版本 ${newVersion}（目前 ${currentVersion}），是否下載並安裝？`,
  updateDownloading: "正在下載更新…",
  updateDownloadProgress: (downloaded, total) =>
    total > 0
      ? `正在下載更新… ${Math.min(100, Math.round((downloaded / total) * 100))}%`
      : "正在下載更新…",
  updateDownloadProgressUnknown: (downloadedBytes) =>
    `正在下載更新… 已接收 ${(downloadedBytes / 1048576).toFixed(1)} MiB`,
  updateInstalling: "正在安裝更新，應用程式將自動重新啟動…",
  errMountLimit: "最多只能掛載 5 個工作區根目錄。",
  errMountIndexInvalid: "此掛載項目已不存在，請重新整理後再試。",
  errCommandConfigSave: (detail) =>
    detail ? `無法儲存設定：${detail}` : "無法儲存設定。",
  errCommandDialog: (detail) => (detail ? `選擇資料夾失敗：${detail}` : "選擇資料夾失敗。"),
  errCommandPathResolve: (detail) =>
    detail ? `無法解析所選目錄：${detail}` : "無法解析所選目錄。",
  errCommandUnknown: (code, detail) =>
    detail && detail.length > 0 ? `錯誤（${code}）：${detail}` : `錯誤：${code}`,
  errRawFallback: (raw) => raw,
};

export const MESSAGES: Record<Locale, Messages> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
};

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
