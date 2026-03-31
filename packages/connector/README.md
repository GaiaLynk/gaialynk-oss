# GaiaLynk 桌面 Connector（E-19）

基于 **Tauri 2** 的轻量托盘应用：生成配对码、挂载工作区、在 **127.0.0.1** 上提供受控文件 API，并向主线回传执行收据（见 `PROTOCOL.md`）。

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
