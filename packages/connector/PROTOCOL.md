# GaiaLynk 桌面 Connector 通信协议（E-19 / 与 E-20 契约）

本文档约定 **Connector 客户端**与**主线 API**之间的 HTTP 契约；E-20 在服务端实现校验与持久化时需与此保持一致。

## 1. 配对轮询

**请求**

```http
GET /api/v1/connectors/desktop/pair-status?pairing_code={6位数字}
```

**响应 JSON（主线 E-20 实际形态）**

包一层 `data`（与 `packages/server` 其它 JSON 一致）：

```json
{
  "data": {
    "status": "pending",
    "device_token": null,
    "device_secret": null,
    "device_id": null
  }
}
```

配对完成后：

```json
{
  "data": {
    "status": "completed",
    "device_token": "<JWT>",
    "device_secret": "<utf8 secret for HMAC>",
    "device_id": "<uuid>"
  }
}
```

> Connector 客户端解析时 **同时兼容** 无 `data` 包裹的扁平 JSON（旧文档 / 本地 mock）。

> Web 侧 `POST /api/v1/connectors/desktop/pair` 由 **E-20** 定义；Connector 仅需轮询 `pair-status`。

### 1.1 设备会话校验（可选，建议实现）

用于在本地仍持有 `device_token` 时周期性确认设备未被 Web 解绑；若已解绑，主线返回 **401/403**，客户端应清除本地 `device_token` / `device_secret` / `device_id` 并恢复配对轮询。**200成功时**主线会更新该设备的 `last_seen_at`，供 Web 端「在线 / 离线」展示与配对完成后的本机轮询间隔对齐。

**请求**

```http
GET /api/v1/connectors/desktop/device/session
Authorization: Bearer {device_token}
```

**响应**：`200` 且 `data.active === true` 表示设备仍为 `active`；**403** `device_revoked` 表示已解绑或设备非激活。

## 2. 本机 HTTP（127.0.0.1 随机端口）

仅绑定 **回环地址**。所有 `/fs/*` 路由：

| 头 | 规则 |
|----|------|
| `Authorization` | `Bearer {device_token}`，与配对结果一致 |
| `Origin` | 若存在：须在 `allowed_web_origins` 中，**或**为 loopback：`http://127.0.0.1` / `http://127.0.0.1:{端口}` / `http://localhost` / `http://localhost:{端口}` / `http://[::1]` / `http://[::1]:{端口}`（随机端口无法事先列入白名单） |
| `X-Gaialynk-Confirmed` | `POST /fs/write` 须为 `true`（大小写不敏感），否则 **403**（Trust 确认流由 Web/E-20 负责） |

### 2.1 `GET /fs/list?path=`

`path` 为相对于**某一挂载根**的相对路径；空表示第一个挂载根的根目录。解析后经 `canonicalize` 校验必须仍位于某一挂载根之下。

**响应**：`[{ "name", "is_dir", "size" }]`

### 2.2 `GET /fs/read?path=`

单文件读取，上限 **10MB**；超出返回 **413**。

**响应**：`{ "encoding": "base64", "content": "..." }`

### 2.3 `POST /fs/write`

**Body JSON**

```json
{
  "path": "相对挂载根的路径",
  "content_base64": "..."
}
```

### 2.4 `GET /fs/watch?path=`

**SSE**（`text/event-stream`），`event: fs`，`data` 为 notify 事件的 JSON 字符串。  
TRUST-DEBT：每个连接会常驻一条 watcher 线程；生产应限流与连接生命周期治理。

## 3. 执行凭证上送

每次 **list / read / write** 成功后，Connector **异步**调用（失败仅日志，不阻塞本机 API）：

```http
POST /api/v1/connectors/desktop/receipts
Authorization: Bearer {device_token}
Content-Type: application/json
```

**Body 字段**

| 字段 | 说明 |
|------|------|
| `device_id` | 配对下发 |
| `action` | `file_list` \| `file_read` \| `file_write` |
| `path_hash` | SHA-256（hex）对 **绝对路径字符串** UTF-8 字节 |
| `status` | `ok` \| `error` |
| `error_code` | 可选 |
| `ts` | RFC3339 UTC |
| `env_signature` | hex(HMAC-SHA256(`device_secret`, **签名体 JSON 字符串**)) |

**签名体**：与请求 body 结构相同，但 **不含** `env_signature`，且为 `ReceiptSignEnvelope` 的 `serde_json::to_string` 结果（字段顺序固定为 `action`, `device_id`, `error_code`, `path_hash`, `status`, `ts`；`error_code` 缺省时序列化省略）。

实现参考：`packages/connector/src-tauri/src/pairing.rs` 中 `ReceiptSignEnvelope` 与 `build_signed_receipt`。

## 3.1 WebSocket `desktop_execute`（主线下行）

Connector 在 **`GET /api/v1/connectors/desktop/ws?device_token=`** 上收到的 JSON 文本帧，类型为 **`desktop_execute`** 时字段包括：

| 字段 | 说明 |
|------|------|
| `type` | 固定 `desktop_execute` |
| `request_id` | 与 `POST .../execute` 响应一致 |
| `device_id` | UUID |
| `action` | `file_list` \| `file_read` \| `file_write` |
| `path` | 相对挂载根路径（与 §2 本机 API 一致） |
| `root_index` | **可选**，默认 `0`；与 `POST .../device/mounts` 同步的 `mounted_roots` 下标一致，本机 `/fs/*` 仅解析该根 |
| `content_base64` | **可选**，仅当 `action=file_write` 且主线请求携带写入正文时出现；标准 base64（UTF-8 字节） |

Connector 应在实现 WS 客户端后，对 `file_read` 调用本机 **`GET /fs/read`**（`path` + `root_index`），对 `file_write` 调用本机 **`POST /fs/write`**（`path` + `content_base64` + `root_index`），再 **`POST .../execute-result`** 回传结果（`file_read` 成功时 `result` 为本机 JSON：`{ "encoding":"base64","content":"..." }`；失败时应重试并打日志）。Web 侧：**首轮** Agent 回复中若含 `gaialynk-desktop-read` 围栏，主线解析路径后经 Connector 读盘，并将内容合并进**第二轮**发往同一 Agent 的输入（会话中通常只展示最终回复；路径/工作区策略与 `file_write` 一致）。详见 `docs/internal/cto-desktop-agent-write-roadmap.md`。

### 3.1.1 `GET /api/v1/connectors/desktop/pending-executes`（device JWT，补拉）

WS 断线期间主网可能已下发 `desktop_execute` 但客户端未收到。Connector 在 **每次 WS 连接成功之后** 应调用本接口，对返回的 `data.items` 逐条按与 WS 帧相同语义执行并 `POST .../execute-result`。条目字段与 WS 帧对齐：`request_id`、`action`、`path`、`root_index`、`content_base64`（`file_write` 时可能有）。

## 3.2 `POST /api/v1/connectors/desktop/device/mounts`（device JWT）

配对完成后由 Connector 将本机 **`mounted_roots`**（最多 5 条路径字符串）与 **`primary_mounted_root_index`**（0–4）同步到主线；请求体 JSON：`{ "mounted_roots": string[], "primary_mounted_root_index": number }`。需 **`Authorization: Bearer <device_token>`**。

## 4. 环境变量

| 变量 | 含义 |
|------|------|
| `GAIALYNK_MAINLINE_URL` | 默认主线基址（无配置文件时） |
