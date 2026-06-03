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

const UPDATER_LOG = "[GaiaLynk Connector updater]";

let activeLocale: Locale = resolveInitialLocale();
let updateCheckInFlight = false;
let trayUpdateListenerRegistered = false;
let advancedOpen = false;
let appVersion = "";

function applyChromeLocale(locale: Locale): void {
  document.documentElement.lang = locale;
  document.title = getMessages(locale).documentTitle;
}

async function refresh(): Promise<StatusPayload> {
  return invoke<StatusPayload>("get_status");
}

async function resolveAppVersion(): Promise<string> {
  if (appVersion) return appVersion;
  try {
    const { getVersion } = await import("@tauri-apps/api/app");
    appVersion = await getVersion();
  } catch {
    appVersion = "";
  }
  return appVersion;
}

function el(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  const n = t.content.firstElementChild;
  if (!n || !(n instanceof HTMLElement)) throw new Error("template");
  return n;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function showToast(message: string, kind: "ok" | "err" = "ok"): void {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-root";
    root.setAttribute("aria-live", "polite");
    document.body.appendChild(root);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${kind}`;
  toast.textContent = message;
  root.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-show"));
  window.setTimeout(() => {
    toast.classList.remove("toast-show");
    window.setTimeout(() => toast.remove(), 220);
  }, 2200);
}

function syncAdvancedOpenFromDom(): void {
  const details = document.getElementById("advanced-details") as HTMLDetailsElement | null;
  if (details) advancedOpen = details.open;
}

function setUpdateProgressBar(mode: "hidden" | "indeterminate" | "determinate", valuePct?: number): void {
  const bar = document.getElementById("update-progress") as HTMLProgressElement | null;
  if (!bar) return;
  if (mode === "hidden") {
    bar.hidden = true;
    bar.removeAttribute("value");
    return;
  }
  bar.hidden = false;
  if (mode === "indeterminate") {
    bar.removeAttribute("value");
  } else {
    bar.value = Math.min(100, Math.max(0, valuePct ?? 0));
  }
}

function setUpdateCheckFeedback(text: string, cls: string, progress?: "indeterminate" | number): void {
  const fb = document.getElementById("update-check-feedback");
  if (!fb) return;
  fb.textContent = text;
  fb.className = `feedback ${cls}`.trim();
  if (progress === undefined) {
    setUpdateProgressBar("hidden");
  } else if (progress === "indeterminate") {
    setUpdateProgressBar("indeterminate");
  } else {
    setUpdateProgressBar("determinate", progress);
  }
}

function clearUpdateCheckFeedback(): void {
  const fb = document.getElementById("update-check-feedback");
  if (!fb) return;
  fb.textContent = "";
  fb.className = "feedback";
  setUpdateProgressBar("hidden");
}

async function runUpdateCheck(userInitiated: boolean): Promise<void> {
  if (updateCheckInFlight) return;
  updateCheckInFlight = true;
  const m = getMessages(activeLocale);
  const btn = (): HTMLElement | null => document.getElementById("btn-check-updates");
  let showDownloadProgressUi = false;
  try {
    if (userInitiated) {
      setUpdateCheckFeedback(m.updateChecking, "pending");
      btn()?.toggleAttribute("disabled", true);
    }
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (userInitiated) {
      clearUpdateCheckFeedback();
      btn()?.toggleAttribute("disabled", false);
    }
    if (!update) {
      if (userInitiated) {
        window.alert(m.updateUpToDate(await resolveAppVersion()));
      } else {
        console.info(UPDATER_LOG, "No update available at startup.");
      }
      return;
    }
    const ok = window.confirm(m.updateAvailable(update.version, update.currentVersion));
    if (!ok) {
      await update.close();
      return;
    }
    showDownloadProgressUi = true;
    setUpdateCheckFeedback(m.updateDownloading, "pending", "indeterminate");
    btn()?.toggleAttribute("disabled", true);
    let downloaded = 0;
    let contentLength = 0;
    try {
      await update.downloadAndInstall((event) => {
        const ev = event as {
          event: string;
          data: { contentLength?: number; chunkLength?: number };
        };
        switch (ev.event) {
          case "Started":
            contentLength = ev.data.contentLength ?? 0;
            if (showDownloadProgressUi) {
              setUpdateCheckFeedback(
                m.updateDownloading,
                "pending",
                contentLength > 0 ? 0 : "indeterminate",
              );
            }
            break;
          case "Progress":
            downloaded += ev.data.chunkLength ?? 0;
            if (showDownloadProgressUi) {
              if (contentLength > 0) {
                const pct = Math.min(100, Math.round((downloaded / contentLength) * 100));
                setUpdateCheckFeedback(m.updateDownloadProgress(downloaded, contentLength), "pending", pct);
              } else {
                setUpdateCheckFeedback(m.updateDownloadProgressUnknown(downloaded), "pending", "indeterminate");
              }
            }
            break;
          case "Finished":
            if (showDownloadProgressUi) {
              setUpdateCheckFeedback(m.updateInstalling, "pending", 100);
            }
            break;
          default:
            break;
        }
      });
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (installErr) {
      const detail = installErr instanceof Error ? installErr.message : String(installErr);
      console.error(UPDATER_LOG, "download/install/relaunch failed:", detail, installErr);
      if (showDownloadProgressUi) {
        clearUpdateCheckFeedback();
        btn()?.toggleAttribute("disabled", false);
        window.alert(m.updateCheckFailed(detail));
      }
    } finally {
      await update.close().catch(() => {});
    }
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error(UPDATER_LOG, "check() failed:", detail, e);
    if (userInitiated) {
      clearUpdateCheckFeedback();
      btn()?.toggleAttribute("disabled", false);
      window.alert(m.updateCheckFailed(detail));
    } else {
      console.warn(UPDATER_LOG, "Startup check failed silently.");
    }
  } finally {
    updateCheckInFlight = false;
  }
}

async function registerTrayUpdateListener(): Promise<void> {
  if (trayUpdateListenerRegistered) return;
  try {
    const { listen } = await import("@tauri-apps/api/event");
    await listen("connector-check-updates", () => {
      void runUpdateCheck(true);
    });
    trayUpdateListenerRegistered = true;
  } catch {
    /* 浏览器 dev 无 Tauri */
  }
}

async function registerPairingStateListener(): Promise<void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    await listen("connector-pairing-state", () => {
      void render();
    });
  } catch {
    /* 浏览器 dev 无 Tauri */
  }
}

async function syncTrayLocale(locale: Locale): Promise<void> {
  try {
    await invoke("set_ui_locale", { locale });
  } catch {
    /* 浏览器 dev 无 Tauri */
  }
}

function localeOptionLabel(m: ReturnType<typeof getMessages>, loc: Locale): string {
  if (loc === "en") return m.langOptionEn;
  if (loc === "zh-Hans") return m.langOptionZhHans;
  return m.langOptionZhHant;
}

function renderMountsList(roots: string[], m: ReturnType<typeof getMessages>): string {
  if (roots.length === 0) {
    return `<p class="mount-empty">${escapeAttr(m.mountsEmpty)}</p>`;
  }
  return `<ul id="roots" class="roots-list">${roots
    .map(
      (r, idx) =>
        `<li class="mount-row"><span class="mount-path" title="${escapeAttr(r)}">${escapeAttr(r)}</span><button type="button" class="btn-remove-mount btn-secondary" data-mount-index="${idx}">${escapeAttr(m.btnRemoveMount)}</button></li>`,
    )
    .join("")}</ul>`;
}

async function render() {
  syncAdvancedOpenFromDom();
  const root = document.getElementById("app");
  if (!root) return;
  const m = getMessages(activeLocale);
  const s = await refresh().catch((e) => {
    root.textContent = formatInvokeErrorForDisplay(e, getMessages(activeLocale));
    return null;
  });
  if (!s) return;

  const version = await resolveAppVersion();
  const statusClass = s.connected ? "status-pill--connected" : "status-pill--waiting";
  const statusLabel = s.connected ? m.statusConnected : m.statusWaiting;
  const codeClass = s.connected ? "code code--paired" : "code";

  root.replaceChildren(
    el(`
    <main class="wrap">
      <header class="app-header">
        <div class="brand-block">
          <h1>${escapeAttr(m.title)}</h1>
          <p>${escapeAttr(m.subtitle)}</p>
          ${version ? `<span class="version-tag">v${escapeAttr(version)}</span>` : ""}
        </div>
        <span class="status-pill ${statusClass}">${escapeAttr(statusLabel)}</span>
      </header>

      <div class="toolbar">
        <button id="btn-check-updates" class="btn-secondary" type="button">${escapeAttr(m.btnCheckUpdates)}</button>
        <div class="toolbar-right">
          <select id="lang-select" class="lang-select" aria-label="${escapeAttr(m.languageLabel)}">
            ${SUPPORTED_LOCALES.map(
              (loc) =>
                `<option value="${loc}"${loc === activeLocale ? " selected" : ""}>${escapeAttr(localeOptionLabel(m, loc))}</option>`,
            ).join("")}
          </select>
        </div>
      </div>

      <div class="update-feedback-block">
        <p id="update-check-feedback" class="feedback update-check-feedback" aria-live="polite"></p>
        <progress id="update-progress" class="update-progress-bar" max="100" value="0" hidden></progress>
      </div>
      <p id="invoke-err" class="feedback err invoke-err" role="alert"></p>

      <section class="card pairing-panel">
        <h2 class="card-title">${escapeAttr(m.sectionConnection)}</h2>
        <p class="pairing-lead">${m.pairingCodeLabelHtml}</p>
        <div class="code-box">
          <p class="${codeClass}">${escapeAttr(s.pairing_code)}</p>
        </div>
        <div class="row">
          <button id="btn-copy" class="btn-copy-primary" type="button">${escapeAttr(m.btnCopyCode)}</button>
          <button id="btn-refresh-code" class="btn-secondary" type="button">${escapeAttr(m.btnRegenerateCode)}</button>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">${escapeAttr(m.sectionMounts)}</h2>
        ${renderMountsList(s.mounted_roots, m)}
        <button id="btn-add-root" type="button">${escapeAttr(m.btnPickDirectory)}</button>
      </section>

      <details id="advanced-details" class="card card-advanced"${advancedOpen ? " open" : ""}>
        <summary>${escapeAttr(m.sectionAdvanced)}</summary>
        <div class="advanced-body">
          <label class="field-label" for="mainline">${escapeAttr(m.sectionMainline)}</label>
          <p class="field-hint">${escapeAttr(m.hintMainline)}</p>
          <input id="mainline" type="text" value="${escapeAttr(s.mainline_base_url)}" autocomplete="off" spellcheck="false" />
          <div class="row row-left">
            <button id="btn-save-url" type="button">${escapeAttr(m.btnSave)}</button>
          </div>
          <p id="url-save-feedback" class="feedback" aria-live="polite"></p>

          <label class="field-label">${escapeAttr(m.sectionLocalApi)}</label>
          <p class="field-hint">${m.localApiMutedHtml}</p>
          <p class="readonly-value">${escapeAttr(s.local_api_base ?? m.localApiStarting)}</p>
        </div>
      </details>
    </main>
  `),
  );

  document.getElementById("advanced-details")?.addEventListener("toggle", (ev) => {
    advancedOpen = (ev.target as HTMLDetailsElement).open;
  });

  document.getElementById("btn-check-updates")?.addEventListener("click", () => {
    void runUpdateCheck(true);
  });

  document.getElementById("lang-select")?.addEventListener("change", (ev) => {
    const sel = ev.target as HTMLSelectElement;
    if (isSupportedLocale(sel.value)) {
      activeLocale = sel.value;
      setStoredLocale(activeLocale);
      applyChromeLocale(activeLocale);
      void syncTrayLocale(activeLocale);
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
    const mm = getMessages(activeLocale);
    const btn = document.getElementById("btn-copy") as HTMLButtonElement | null;
    try {
      await navigator.clipboard.writeText(s.pairing_code);
      showToast(mm.copyCodeSuccess, "ok");
      if (btn) {
        const orig = mm.btnCopyCode;
        btn.textContent = mm.btnCopyCodeCopied;
        btn.classList.add("btn-copy-flash");
        window.setTimeout(() => {
          btn.textContent = orig;
          btn.classList.remove("btn-copy-flash");
        }, 1800);
      }
    } catch {
      showToast(mm.copyCodeFailed, "err");
    }
  });

  document.getElementById("btn-save-url")?.addEventListener("click", async () => {
    const mm = getMessages(activeLocale);
    const v = (document.getElementById("mainline") as HTMLInputElement).value.trim();
    const setBusy = (busy: boolean) => {
      document.getElementById("btn-save-url")?.toggleAttribute("disabled", busy);
    };
    const setFb = (text: string, cls: string) => {
      const elFb = document.getElementById("url-save-feedback");
      if (!elFb) return;
      elFb.textContent = text;
      elFb.className = `feedback ${cls}`.trim();
    };
    setBusy(true);
    setFb(mm.saving, "pending");
    try {
      const saved = await invoke<string>("set_mainline_base_url", { url: v });
      await render();
      setFb(getMessages(activeLocale).savedWithUrl(saved), "ok");
      window.setTimeout(() => {
        const elFb = document.getElementById("url-save-feedback");
        if (elFb?.classList.contains("ok")) {
          elFb.textContent = "";
          elFb.className = "feedback";
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

  document.getElementById("roots")?.addEventListener("click", async (ev) => {
    const t = ev.target as HTMLElement | null;
    const btnEl = t?.closest?.("button[data-mount-index]") as HTMLButtonElement | null;
    if (!btnEl) return;
    const index = Number.parseInt(btnEl.dataset.mountIndex ?? "", 10);
    if (!Number.isFinite(index) || index < 0) return;
    try {
      await invoke("remove_mount_at_index", { index });
      await render();
    } catch (e) {
      await render();
      const errEl = document.getElementById("invoke-err");
      if (errEl) errEl.textContent = formatInvokeErrorForDisplay(e, getMessages(activeLocale));
    }
  });
}

async function bootstrap(): Promise<void> {
  applyChromeLocale(activeLocale);
  await registerTrayUpdateListener();
  await registerPairingStateListener();
  await syncTrayLocale(activeLocale);
  void runUpdateCheck(false);
  await render();
}

void bootstrap();
