# GaiaLynk 桌面 Connector（E-19）

基于 **Tauri 2** 的轻量托盘应用：生成配对码、挂载工作区、在 **127.0.0.1** 上提供受控文件 API，并向主线回传执行凭证（见 `PROTOCOL.md`）。

## 前置

- [Rust / rustup](https://rustup.rs/)
- Node.js 20+
- macOS / Windows（与 Tauri 目标平台一致）

## 开发

```bash
cd packages/connector
npm install
npm run tauri:dev
```

## 构建

```bash
npm run tauri:build
```

macOS 产物通常在 `src-tauri/target/release/bundle/macos/*.app` 与 `bundle/dmg/*.dmg`。

若命令行里设置了 `CI=1`（部分 IDE 会注入），旧版 Tauri CLI 可能把 `--ci` 解析失败；本仓库的 `tauri:build` 脚本已 `unset CI` 规避。

图标需满足打包器要求；若改主图标，在 `packages/connector` 下执行：

```bash
npx tauri icon src-tauri/icons/1024x1024.png
```

并保留 `tauri.conf.json` 里 `bundle.icon` 所列 `icns` / `ico` / PNG。

产物体积与「小于 15MB」目标依赖 **release + strip + UPX（可选）**；需在 CI 上对 `aarch64-apple-darwin`、`x86_64-pc-windows-msvc` 等目标实测。

## 界面语言

- 支持 **English**、**简体中文**、**繁體中文**（与官网 `en` / `zh-Hans` / `zh-Hant` 一致）。
- 首次启动按 **系统/浏览器语言** 推断；在窗口右上角 **语言** 下拉切换，选择写入 **localStorage**（`gaialynk.connector.locale`），下次打开沿用。
- 启动与切换语言时会同步 **托盘菜单** 文案，并把当前语言写入 `config.json` 的 **`ui_locale`**（与上述三语一致：`en` / `zh-Hans` / `zh-Hant`）。托盘文案与 `src-tauri/src/tray_labels.rs` 对应；若改界面文案请同步改该文件。

## 应用内更新（Tauri updater）

- 启动时会静默请求 `tauri.conf.json` 里 `plugins.updater.endpoints`（默认 `gaialynk-oss` 的 `latest.json`）。**失败时不再完全静默**：会在开发者工具控制台输出 `[GaiaLynk Connector updater]` 日志；主窗口提供 **「检查更新」** 按钮，托盘菜单提供 **「检查更新」**，便于查看具体错误（网络、签名等）。
- 若需人工核对：在浏览器打开与 endpoints 一致的 `latest.json` URL，确认能下载且 JSON 合法。
- **排障时如何把日志给别人**：① **弹窗全文**（或截图）复制错误第一行，例如 `Command plugin:updater|check not allowed by ACL`；② **开发者工具**：右键窗口 → 检查元素 / Inspect → **Console**，筛选 `[GaiaLynk Connector updater]`，把相关几行 **复制为文字** 粘贴到 issue/聊天；③ **版本**：窗口内或关于里看 **0.x.y**，并说明 **macOS / Windows** 与是否 **从官网 DMG/MSI 安装**。无需上传整份系统日志，除非对方明确要求。
- **常见错误 `plugin:updater|check not allowed by ACL`**：前端调用了 `check()`，但 **capabilities** 未授予 **updater**。本仓库在 `capabilities/desktop.json` 中配置了 **`updater:default`**，且 **`tauri.conf.json` → `app.security.capabilities`** 须包含 **`desktop-capability`**（与 **`default`** 并列）。若自行改过 capabilities，请对照提交。

## 命令错误（多语言）

- Tauri 命令失败时，Rust 返回 **JSON 字符串**：`{"code":"MOUNT_LIMIT_REACHED"}` 或带 `detail` 的 `CONFIG_SAVE_FAILED` / `DIALOG_TASK_FAILED` / `PATH_RESOLVE_FAILED`。
- 前端按当前界面语言展开文案；非 JSON 或未知 `code` 时回退为原始消息。

## 文档

- 主网与本地 API 契约：`PROTOCOL.md`
- 威胁模型：`docs/Desktop-Connector-Threat-Model-v1.md`（仓库根 `docs/`）

## 测试

```bash
cd packages/connector/src-tauri && cargo test
```

仓库根 Vitest 包含对 `PROTOCOL.md` 存在性与关键段落的轻量校验。
