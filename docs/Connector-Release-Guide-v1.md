# Connector 发布指南（E-21）

本文档说明如何通过 GitHub Actions 发布 **GaiaLynk 桌面 Connector**（Tauri v2，位于 `packages/connector`），以及与自动更新清单、下载链接环境变量的关系。

## 触发发布

> **公开下载与自动更新**依赖 **`GaiaLynk/gaialynk-oss`** 上的 Release（`tauri.conf.json` 内 updater **`endpoints`** 指向该仓的 **`latest.json`**）。**请先**按 **`docs/GitHub-Private-Public-Split-Runbook-v1.md` §2 +「Connector 公开发布」** 完成 **白名单同步到 OSS**，**再**在 **`gaialynk-oss`** 上打下面的 tag。仅在 **`gaialynk-internal`** 打 `connector-v*` 只会触发私仓上的 Actions（若已启用），**不会**更新 OSS 的公开包。

1. 将 `packages/connector/src-tauri/tauri.conf.json` 与 `packages/connector/src-tauri/Cargo.toml` 中的 **version** 与将要打的 tag **语义化版本对齐**（例如 `0.2.0`），且该版本已随 **`gaialynk-oss` 的 `main`** 同步可见（见上 Runbook）。
2. 在 **`gaialynk-oss`** 仓库（克隆的 `origin` 指向本仓）中创建并推送 tag（前缀固定为 `connector-v`）：

```bash
git tag connector-v0.2.0
git push origin connector-v0.2.0
```

3. 工作流：`.github/workflows/connector-release.yml` 会在 **Windows** 与 **macOS aarch64** 并行启动；**x86_64 mac** 在 aarch64 完成后串行，三条产物仍上传到 **同一 GitHub Release**（tag 与 ref 一致）。

## Windows：当前为未签名构建

按 CTO 决策，本阶段 **不提供 Authenticode 签名**。产物仍为正式 `.msi` / `.exe`，用户可能遇到 SmartScreen /「未发布者」提示，需在文档与支持渠道中说明。

后续若购入证书，可在工作流中增加 `signtool` 或使用支持 Windows 签名的构建动作，并配置例如 `WINDOWS_CERTIFICATE`（Base64 `.pfx`）与密码 Secret（与 CTO 指令草案一致）。

## macOS：可选签名与公证

未配置 Apple 相关 Secrets 时，CI 产出 **未签名** `.dmg`（本地测试与内部分发可用）。

若已加入 **Apple Developer Program** 并导出 **Developer ID Application** `.p12`：

- 在仓库 **Settings → Secrets and variables → Actions** 中配置（名称与 CTO 指令对齐，可按需增减）：
  - `APPLE_CERTIFICATE`：`.p12` 的 Base64（`openssl base64 -A -in cert.p12`）
  - `APPLE_CERTIFICATE_PASSWORD`
  - `KEYCHAIN_PASSWORD`：CI 临时钥匙串密码（可随机强密码）
  - 可选：`APPLE_SIGNING_IDENTITY`（若自动检测失败）
  - 公证（任选一种方式）：
    - Apple ID：`APPLE_ID`、`APPLE_PASSWORD`（建议使用 App 专用密码）、`APPLE_TEAM_ID`
    - 或 App Store Connect API：`APPLE_API_ISSUER`、`APPLE_API_KEY`，以及构建前写入磁盘的私钥文件路径（`APPLE_API_KEY_PATH`，由 workflow 内步骤生成，不要当作一行 Secret 粘贴）

具体环境变量以 [Tauri macOS 签名文档](https://v2.tauri.app/distribute/sign/macos/) 为准。

**公证卡住数小时**：与安装包体积**无必然关系**（`notarytool` 提交后轮询 Apple，队列/故障时小包也会长时间停在 `Notarizing …`）。若已用 **Apple ID 三条**（`APPLE_ID` / `APPLE_PASSWORD` / `APPLE_TEAM_ID`），workflow **不要**再注入 `APPLE_API_ISSUER` / `APPLE_API_KEY`（易与「API Key 路线」混淆；Tauri 虽优先 Apple ID，但减少误配）。Actions 日志请搜 `NSURLError`、`HTTP`、`401`、`offline`；工作流含对 `appstoreconnect.apple.com` 的预检。紧急排障见 Tauri `--skip-stapling`（**不等待公证完成**，产物可能尚不可分发，仅作解锁 CI 用）。

本地验收：`spctl --assess --type execute -v path/to/GaiaLynk\ Connector.app`。

## GitHub Release 与下载 URL（Railway）

发布后，在 Release Assets 中取得 **macOS `.dmg`** 与 **Windows `.msi` / `.exe`** 的直链，写入 Railway（或部署环境）：

- `DESKTOP_CONNECTOR_DOWNLOAD_URL_MAC`
- `DESKTOP_CONNECTOR_DOWNLOAD_URL_WIN`

官网与应用内若使用「latest 下载」模式，可采用：

`https://github.com/<org>/<repo>/releases/latest/download/<文件名>`

文件名以实际 Asset 为准（与 Tauri `productName`、版本、目标架构相关）。

### 命名规则（与 `connector-v0.1.0` 实有 Asset 对齐）

Tauri 会将 `productName`「GaiaLynk Connector」中的空格变为 **`.`**，故文件名形如 **`GaiaLynk.Connector_<version>_<arch>.dmg`**，Windows 常见还有 **`_x64_en-US.msi`**、**`-setup.exe`**。**勿**使用文档里偶见的 `GaiaLynk-Connector_…` 写法（连字符），否则 404。

### 官网 / 应用内下载按钮（`latest.json` 取版本，直链用安装包）

营销站下载页、首页 Connector 板块、**设置 → 连接器** 在 **未同时设置** `DESKTOP_CONNECTOR_DOWNLOAD_URL_MAC` **与** `DESKTOP_CONNECTOR_DOWNLOAD_URL_WIN` 时，会在服务端请求 **`…/releases/latest/download/latest.json`**，读取其中的 **`version`**，再按约定拼 **首次安装** 直链：

- **Mac（Apple Silicon）**：`…/download/connector-v{version}/GaiaLynk.Connector_{version}_aarch64.dmg`
- **Windows**：`…/download/connector-v{version}/GaiaLynk.Connector_{version}_x64_en-US.msi`（官网服务端会对 MSI 做 **HEAD**；若不存在则回退同目录 **`…_x64-setup.exe`**。若 `latest.json` 里 Windows 指向 **`.zip` 等 updater 包**，仍按 `version` 拼上述安装包名。）

**不会**直接使用 `platforms.*.url` 作为官网按钮链接——该字段在 Tauri updater 中多为 **`.app.tar.gz` 等更新包**，不适合给浏览器用户当「下载安装」入口。清单里的 **版本号**与 **GitHub Release tag `connector-v*`** 对齐即可；ISR 约 5 分钟内会跟新版。

若 **`NEXT_PUBLIC_DESKTOP_CONNECTOR_RELEASES_URL`** 不是 `github.com/{owner}/{repo}/releases` 形式，官网会尝试从 `platforms` 里 **GitHub** asset URL 解析 `owner/repo/tag` 再拼 **`.dmg` / `.msi`**；仍无法解析时回退为 manifest 原始 `url`。

可选：**`DESKTOP_CONNECTOR_LATEST_JSON_URL`** 覆盖清单地址；**`NEXT_PUBLIC_DESKTOP_CONNECTOR_RELEASES_URL`** 覆盖 Releases 根（并用于推导默认清单 URL 与 Release notes 链接）。

### 强绑固定版本（可选，需同时设置 Mac + Win）

在 **Vercel**（官网 `packages/website`）**Environment Variables** 中 **同时** 写入下面两项时，站点 **不再** 拉取 `latest.json`（适合离线构建或强制钉死某 tag）：

| 变量 | 示例（tag 固定） | 说明 |
|------|------------------|------|
| `DESKTOP_CONNECTOR_DOWNLOAD_URL_MAC` | `https://github.com/GaiaLynk/gaialynk-oss/releases/download/connector-v0.1.6/GaiaLynk.Connector_0.1.6_aarch64.dmg` | 官网仅一个 Mac 直链位：**Apple Silicon（aarch64）**。Intel Mac 需从 [Releases](https://github.com/GaiaLynk/gaialynk-oss/releases) 取 **`…_x64.dmg`**。 |
| `DESKTOP_CONNECTOR_DOWNLOAD_URL_WIN` | `https://github.com/GaiaLynk/gaialynk-oss/releases/download/connector-v0.1.6/GaiaLynk.Connector_0.1.6_x64_en-US.msi` | 与 Tauri 资产命名一致；若某次 Release 未上传 `.msi`，可改为 **`…_x64-setup.exe`**。 |

写入后 **重新部署** 官网。

**运维核对步骤（强绑模式）**：打开对应 Release → 复制 Assets 里文件名 → 拼进 `…/download/<tag>/<文件名>`。若打包调整导致文件名差异，**以页面为准** 更新环境变量。

## Tauri 自动更新（latest.json）

应用内自动更新需要：

1. 安装并配置 **tauri-plugin-updater**（`pubkey`、`endpoints`），在 `bundle` 中设置 `createUpdaterArtifacts: true`；
2. 构建时在环境中提供 **`TAURI_SIGNING_PRIVATE_KEY`**（及可选密码），使产物生成 `.sig`；
3. 将 **`latest.json`** 与对应安装包、`.sig` 一并作为 Release Assets 发布。

仓库提供脚本 **`packages/connector/scripts/generate-updater-manifest.mjs`**，可根据各平台 `url` 与 `.sig` 内容生成符合 Tauri v2 的静态 JSON。启用 CI 中的 `includeUpdaterJson`（`tauri-apps/tauri-action`）前，需完成上述应用侧配置与密钥。

### `TAURI_SIGNING_PRIVATE_KEY` 在 GitHub Actions 里的正确格式（必读）

**务必使用「仓库级」Actions Secret，不要只写在 Environment 里**（除非你在 workflow 的 job 上显式写了 `environment:` 且密钥配置在该 Environment 下）。若密钥只存在于 **Settings → Environments → 某环境 → Environment secrets**，而 **connector-release** 工作流**没有**引用该 environment，则 `secrets.TAURI_SIGNING_PRIVATE_KEY` 在 CI 里为**空**，Tauri 会报 **`Missing encoded key in secret key`** / **`Missing comment in secret key`** 等（与 [tauri-action#658](https://github.com/tauri-apps/tauri-action/issues/658) 中案例一致）。正确做法：在 **Settings → Secrets and variables → Actions** 下 **Repository secrets** 中新增 `TAURI_SIGNING_PRIVATE_KEY`（及按需的 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`）。

本仓库工作流在构建前会校验密钥**非空**（输出长度、过短则失败并提示上述路径），再将 Secret 写入 **`RUNNER_TEMP/tauri-updater.key`** 并设置 **`TAURI_SIGNING_PRIVATE_KEY_PATH`**（便于核对文件大小）。**`tauri-apps/tauri-action` 一步还须显式注入 `TAURI_SIGNING_PRIVATE_KEY`**：`@tauri-apps/cli` 2.10+ 生成 updater **`.sig`** 时以该变量为准；若仅依赖 `GITHUB_ENV` 里的 `_PATH`，会报错 **`A public key has been found, but no private key`**（与 Windows / mac 无关，三 job 均已注入）。

Tauri 在构建时会把该 Secret **按 Base64 解码**后再用于 minisign。因此仓库 **Settings → Secrets → Actions** 里保存的必须是：

- **一整行**、**无换行**的 **Base64 字符串**（由**私钥文件的字节**编码而来），**不要**把 minisign 的**多行明文私钥**直接粘进 Secret（否则会报 `failed to decode base64 secret key` / `Invalid symbol 61` 等，其中 `61` 为 ASCII `=`，多为非法 padding 或明文被误当 Base64 解析）。
- 字符串中**不得**出现 **`%`**（否则常见报错 **`Invalid symbol 37`**）：不要把 Base64 再做 **URL 编码**（如把 `=` 变成 `%3D`）后写入 Secret。

在本地（私钥文件勿提交 git，例如 `packages/connector/.keys/updater.key` 仅本地存在）生成可粘贴的 Secret：

```bash
# macOS / Linux：去掉所有换行后复制输出到 GitHub Secret「TAURI_SIGNING_PRIVATE_KEY」
base64 < /path/to/your/updater.key | tr -d '\n'
# 若需无换行包装（部分系统）：
# openssl base64 -A -in /path/to/your/updater.key
```

有密码时另设 Secret **`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`**（与生成密钥时**逐字一致**；Tauri 社区曾报告「交互式输入密码可用、环境变量却报错」，多与**粘贴带入不可见字符**或终端差异有关，必要时在本地用同一对 env 跑一次 `npm run tauri build` 验证）。

若私钥**生成时未设密码**（`tauri signer generate --ci` 会生成无交互密码的密钥，文件头仍可能显示 `rsign encrypted secret key`，属正常）：

- **本地构建**：须**显式**导出空密码，否则 Tauri 会尝试从终端读密码，非 TTY 下报错 **`Device not configured (os error 6)`**：
  ```bash
  export TAURI_SIGNING_PRIVATE_KEY="$(tr -d '\n' < /path/to/updater.key)"
  export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
  npm run tauri:build
  ```
- **GitHub Actions**：勿在仓库里配置**错误**的 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`；未创建该 Secret 时，本仓库 **`.github/workflows/connector-release.yml`** 会通过 **`GITHUB_ENV`** 写入 **`TAURI_SIGNING_PRIVATE_KEY_PASSWORD=`**（显式空字符串）。若曾误设占位密码，请删除该 Secret 后重跑 workflow。

生成新密钥对（与 `tauri.conf.json` 里 `pubkey` 须匹配）：

```bash
cd packages/connector && npm run tauri -- signer generate -w ~/.tauri/gaialynk-connector.key
# 私钥：openssl base64 -A -in xxx.key → 整行写入 TAURI_SIGNING_PRIVATE_KEY
# 公钥：tauri.conf.json 的 plugins.updater.pubkey 须为「整份 .pub 文件」的 Base64 单行（与私钥同对），例如：
#   openssl base64 -A -in ~/.tauri/gaialynk-connector.key.pub
# 勿只填 .pub 里第二行的 RWS…（仅该行再当 Base64 解码会得到非 UTF-8，CI 报 invalid utf-8 sequence）
```

生成示例：

```bash
node packages/connector/scripts/generate-updater-manifest.mjs \
  --version 0.2.0 \
  --input manifest-input.json \
  --out latest.json
```

## 故障排查

- **Resource not accessible by integration**：仓库 **Settings → Actions → General → Workflow permissions** 勾选 **Read and write**。
- **版本与 tag 不一致**：确保 `tauri.conf.json` / `Cargo.toml` 的 version 与 `connector-v*` tag 中的版本号匹配。
- **构建因 `CI` 失败**：工作流已设置 `CI: false`；本地可用 `npm run tauri:build`（已 `unset CI`）。
- **某条 job（常见为 Apple Silicon / `aarch64`）显示 cancelled，其它架构 success**：多为 **单 job 超时**（含 Apple 公证排队）或 **短时间内重复推送同一 tag** 触发并发取消。当前 workflow 已加长 `timeout-minutes`、关闭 `cancel-in-progress`；**两条 mac 架构串行**（`x86_64` `needs` `aarch64`），同一时刻只占用 **1** 个 macOS Runner，Windows 与首条 mac 仍可并行。若仍失败，在 Actions 日志中确认是否卡在 **Notarizing**，必要时稍后再发版或检查 Apple 侧状态。
- **`failed to decode base64 secret key` / `Invalid symbol 61`**（`61` = `=`）：多为把 **minisign 多行明文**当 Secret，或 Base64 **含换行**。须用 **私钥文件 → Base64 → 删净换行** 的一整行写入 `TAURI_SIGNING_PRIVATE_KEY`。按上文 **「TAURI_SIGNING_PRIVATE_KEY 在 GitHub Actions 里的正确格式」** 重设后 **Re-run**。
- **`Invalid symbol 37`**（`37` = **`%`**）：Secret 里出现了 **URL 编码**或其它非法字符。常见是把 Base64 从浏览器地址栏、某工具里复制成了带 **`%3D`**（等号）等形式。请只用终端输出的 **纯 Base64**（仅 `A–Za–z0–9+/=`），**不要** URL 编码；在 GitHub Secret 编辑框里**不要**加引号、不要首尾空格。终端末尾单独一列 **`%`**（zsh 在「输出无换行」时的提示）**不是** Base64 的一部分，**切勿**粘进 Secret。
- **`incorrect updater private key password: Device not configured (os error 6)`**（本地脚本、CI 非交互环境常见）：多为**无密码密钥**却**未设置**环境变量 **`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`**（「未设置」与「设为空字符串」在 Tauri 里行为不同——未设置会走交互读终端）。处理：**`export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""`** 后再构建；CI 侧使用本仓库 **connector-release** 工作流里 **`Export TAURI_SIGNING_PRIVATE_KEY_PASSWORD`** 一步，或自行等价写入 `GITHUB_ENV`。
- **`incorrect updater private key password: Missing encoded key in secret key`** / **`Missing comment in secret key`**：① **最常见**：`TAURI_SIGNING_PRIVATE_KEY` 在 CI 里实际为**空**（密钥只配在 **Environment secrets** 而未在 job 上使用 `environment:`，或未配 **Repository secret**）——见上文 **「务必使用仓库级 Secret」**。② 其次：密码与密钥不匹配、粘错 `.pub`、Base64 截断/多字符等。处理顺序：在 **Repository secrets** 中重设 `TAURI_SIGNING_PRIVATE_KEY`；无密码时删掉错误的 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 并依赖 workflow 中的 **显式空字符串** 密码导出；仍失败再考虑重新生成密钥对并更新 `tauri.conf.json` 的 `pubkey`。
- **`failed to decode pubkey` / `invalid utf-8 sequence`（Base64 pubkey）**：`plugins.updater.pubkey` 填错了。Tauri 会把该字段当作 **Base64** 解码，且解码后的字节须为 **UTF-8**（即整份 minisign `.pub` 明文）。请改为 `openssl base64 -A -in your.key.pub` 的**整行输出**，不要只填公钥第二行的 `RWS…` 字符串。

## 分仓部署验证（公仓 `gaialynk-oss`）

- 同步白名单后，在 **公仓** 打 `connector-v*` tag 会触发本指南对应的 Release 工作流；`latest.json` 应出现在该 Release 资产中（匿名 URL 见 `tauri.conf.json` → `updater.endpoints`）。
- 本次验证戳：**2026-03-30**（Connector 版本与 tag 对齐见下文版本号）。

## 相关文件

| 说明           | 路径 |
|----------------|------|
| Release 工作流 | `.github/workflows/connector-release.yml` |
| 更新清单脚本   | `packages/connector/scripts/generate-updater-manifest.mjs` |
| Tauri 配置     | `packages/connector/src-tauri/tauri.conf.json` |
