import { invoke } from "@tauri-apps/api/core";
import {
  type Locale,
  formatInvokeErrorForDisplay,
  getMessages,
  isSupportedLocale,
  resolveInitialLocale,
  setStoredLocale,
  SUPPORTED_LOCALES,
} from "./i18n";

type StatusPayload = {
  pairing_code: string;
  connected: boolean;
  mainline_base_url: string;
  local_api_base: string | null;
  mounted_roots: string[];
  device_id: string | null;
};

let activeLocale: Locale = resolveInitialLocale();

function applyChromeLocale(locale: Locale): void {
  document.documentElement.lang = locale;
  document.title = getMessages(locale).documentTitle;
}

async function refresh(): Promise<StatusPayload> {
  return invoke<StatusPayload>("get_status");
}

function el(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  const n = t.content.firstElementChild;
  if (!n || !(n instanceof HTMLElement)) throw new Error("template");
  return n;
}

async function render() {
  const root = document.getElementById("app");
  if (!root) return;
  const m = getMessages(activeLocale);
  const s = await refresh().catch((e) => {
    root.textContent = formatInvokeErrorForDisplay(e, getMessages(activeLocale));
    return null;
  });
  if (!s) return;

  root.replaceChildren(
    el(`
    <main class="wrap">
      <div class="toolbar">
        <label class="lang-label" for="lang-select">${escapeAttr(m.languageLabel)}</label>
        <select id="lang-select" class="lang-select" aria-label="${escapeAttr(m.languageLabel)}">
          ${SUPPORTED_LOCALES.map(
            (loc) =>
              `<option value="${loc}"${loc === activeLocale ? " selected" : ""}>${escapeAttr(
                localeOptionLabel(m, loc),
              )}</option>`,
          ).join("")}
        </select>
      </div>
      <p id="invoke-err" class="feedback err invoke-err" role="alert"></p>
      <h1>${escapeAttr(m.title)}</h1>
      <section class="card">
        <h2>${escapeAttr(m.sectionConnection)}</h2>
        <p class="muted">${escapeAttr(s.connected ? m.statusConnected : m.statusWaiting)}</p>
        <p class="hint">${m.hintPairingStuckHtml}</p>
        <p class="pairing-lead">${m.pairingCodeLabelHtml}</p>
        <p class="code">${escapeAttr(s.pairing_code)}</p>
        <div class="row">
          <button id="btn-refresh-code" type="button">${escapeAttr(m.btnRegenerateCode)}</button>
          <button id="btn-copy" type="button">${escapeAttr(m.btnCopyCode)}</button>
        </div>
      </section>
      <section class="card">
        <h2>${escapeAttr(m.sectionMainline)}</h2>
        <p class="hint">${escapeAttr(m.hintMainline)}</p>
        <input id="mainline" type="text" value="${escapeAttr(s.mainline_base_url)}" />
        <div class="row">
          <button id="btn-save-url" type="button">${escapeAttr(m.btnSave)}</button>
        </div>
        <p id="url-save-feedback" class="feedback" aria-live="polite"></p>
      </section>
      <section class="card">
        <h2>${escapeAttr(m.sectionLocalApi)}</h2>
        <p class="muted">${m.localApiMutedHtml}</p>
        <p><code>${escapeAttr(s.local_api_base ?? m.localApiStarting)}</code></p>
      </section>
      <section class="card">
        <h2>${escapeAttr(m.sectionMounts)}</h2>
        <ul id="roots">${s.mounted_roots.map((r) => `<li>${escapeAttr(r)}</li>`).join("")}</ul>
        <button id="btn-add-root" type="button">${escapeAttr(m.btnPickDirectory)}</button>
      </section>
    </main>
  `),
  );

  document.getElementById("lang-select")?.addEventListener("change", (ev) => {
    const sel = ev.target as HTMLSelectElement;
    const v = sel.value;
    if (isSupportedLocale(v)) {
      activeLocale = v;
      setStoredLocale(v);
      applyChromeLocale(v);
      void render();
    }
  });

  document.getElementById("btn-refresh-code")?.addEventListener("click", async () => {
    try {
      await invoke("regenerate_pairing_code");
      await render();
    } catch (e) {
      await render();
      const errEl = document.getElementById("invoke-err");
      if (errEl) errEl.textContent = formatInvokeErrorForDisplay(e, getMessages(activeLocale));
    }
  });
  document.getElementById("btn-copy")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(s.pairing_code);
  });
  document.getElementById("btn-save-url")?.addEventListener("click", async () => {
    const mm = getMessages(activeLocale);
    const v = (document.getElementById("mainline") as HTMLInputElement).value.trim();
    const setBusy = (busy: boolean) => {
      document.getElementById("btn-save-url")?.toggleAttribute("disabled", busy);
    };
    const setFb = (text: string, cls: string) => {
      const el = document.getElementById("url-save-feedback");
      if (!el) return;
      el.textContent = text;
      el.className = `feedback ${cls}`.trim();
    };
    setBusy(true);
    setFb(mm.saving, "pending");
    try {
      const saved = await invoke<string>("set_mainline_base_url", { url: v });
      await render();
      const mm2 = getMessages(activeLocale);
      setFb(mm2.savedWithUrl(saved), "ok");
      window.setTimeout(() => {
        const el = document.getElementById("url-save-feedback");
        if (el?.classList.contains("ok")) {
          el.textContent = "";
          el.className = "feedback";
        }
      }, 5000);
    } catch (e) {
      await render();
      setFb(formatInvokeErrorForDisplay(e, getMessages(activeLocale)), "err");
    } finally {
      document.getElementById("btn-save-url")?.toggleAttribute("disabled", false);
    }
  });
  document.getElementById("btn-add-root")?.addEventListener("click", async () => {
    try {
      await invoke("add_mount_directory");
      await render();
    } catch (e) {
      await render();
      const errEl = document.getElementById("invoke-err");
      if (errEl) errEl.textContent = formatInvokeErrorForDisplay(e, getMessages(activeLocale));
    }
  });
}

function localeOptionLabel(m: ReturnType<typeof getMessages>, loc: Locale): string {
  if (loc === "en") return m.langOptionEn;
  if (loc === "zh-Hans") return m.langOptionZhHans;
  return m.langOptionZhHant;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const style = document.createElement("style");
style.textContent = `
  body { font-family: system-ui, sans-serif; margin: 0; background: #0f1419; color: #e6edf3; }
  .wrap { max-width: 440px; margin: 0 auto; padding: 1.25rem; }
  .toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; margin-bottom: 0.35rem; }
  .invoke-err { margin: 0 0 0.75rem; min-height: 0; }
  .invoke-err:empty { display: none; }
  .lang-label { font-size: 0.8rem; color: #8b949e; }
  .lang-select { font-size: 0.8rem; padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid #30363d; background: #0d1117; color: inherit; }
  h1 { font-size: 1.15rem; font-weight: 600; margin: 0 0 1rem; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
  h2 { font-size: 0.95rem; margin: 0 0 0.5rem; }
  .muted { color: #8b949e; font-size: 0.85rem; }
  .hint { color: #8b949e; font-size: 0.78rem; line-height: 1.35; margin: 0 0 0.5rem; }
  .pairing-lead { margin: 0.5rem 0 0.25rem; font-size: 0.9rem; }
  .feedback { min-height: 1.25em; font-size: 0.8rem; margin: 0.5rem 0 0; }
  .feedback.ok { color: #3fb950; }
  .feedback.err { color: #f85149; }
  .feedback.pending { color: #d29922; }
  .code { font-size: 1.75rem; letter-spacing: 0.2em; font-weight: 700; font-family: ui-monospace, monospace; }
  .row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  button { background: #238636; color: #fff; border: none; padding: 0.45rem 0.75rem; border-radius: 6px; cursor: pointer; }
  button:hover { filter: brightness(1.08); }
  button:disabled { opacity: 0.55; cursor: not-allowed; filter: none; }
  input[type=text] { width: 100%; box-sizing: border-box; padding: 0.45rem; border-radius: 6px; border: 1px solid #30363d; background: #0d1117; color: inherit; margin-bottom: 0.5rem; }
  ul { padding-left: 1.1rem; margin: 0.5rem 0; }
  code { font-size: 0.85rem; }
`;
document.head.appendChild(style);

/** 启动时检查更新（仅 Tauri 壳内有效；dev 浏览器会静默失败） */
async function maybeCheckUpdater(): Promise<void> {
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update) return;
    try {
      const msg = getMessages(activeLocale).updateAvailable(update.version, update.currentVersion);
      const ok = window.confirm(msg);
      if (ok) {
        await update.downloadAndInstall();
      }
    } finally {
      await update.close();
    }
  } catch {
    // 非 Tauri 或网络失败：忽略
  }
}

applyChromeLocale(activeLocale);
void maybeCheckUpdater();
void render();
