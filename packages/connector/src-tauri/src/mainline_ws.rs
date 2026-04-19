//! 主网 `GET .../connectors/desktop/ws` 客户端：消费 `desktop_execute`，经本机 `local_server` 执行后 `POST .../execute-result`（路线图阶段 B）。
//! 重连成功后会 `GET .../pending-executes` 补拉断线期间未结算任务；`execute-result` 带有限次重试与日志。

use crate::local_server::SharedState;
use futures::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::time::Duration;
use tokio_tungstenite::tungstenite::protocol::Message;
use url::Url;

fn build_desktop_ws_url(mainline_base: &str, device_token: &str) -> anyhow::Result<Url> {
    let u = Url::parse(mainline_base.trim_end_matches('/'))?;
    let scheme = match u.scheme() {
        "http" => "ws",
        "https" => "wss",
        s => anyhow::bail!("unsupported mainline scheme: {s}"),
    };
    let host = u.host_str().ok_or_else(|| anyhow::anyhow!("missing host"))?;
    let port = u.port();
    let query = format!("device_token={}", urlencoding::encode(device_token));
    let mut out = format!("{scheme}://{host}");
    if let Some(p) = port {
        let default = if scheme == "wss" { 443 } else { 80 };
        if p != default {
            out.push(':');
            out.push_str(&p.to_string());
        }
    }
    out.push_str("/api/v1/connectors/desktop/ws?");
    out.push_str(&query);
    Ok(Url::parse(&out)?)
}

enum ExecOk {
    Json(Value),
    Empty,
}

async fn handle_desktop_execute_local(
    client: &reqwest::Client,
    local_base: &str,
    bearer: &str,
    action: &str,
    path: &str,
    root_index: u32,
    content_b64: Option<&str>,
) -> anyhow::Result<ExecOk> {
    let base = local_base.trim_end_matches('/');
    match action {
        "file_list" => {
            let url = format!(
                "{}/fs/list?path={}&root_index={}",
                base,
                urlencoding::encode(path),
                root_index
            );
            let res = client
                .get(&url)
                .header("Authorization", format!("Bearer {}", bearer))
                .send()
                .await?;
            if !res.status().is_success() {
                anyhow::bail!("file_list http {}", res.status());
            }
            let items: Value = res.json().await?;
            Ok(ExecOk::Json(json!({ "items": items })))
        }
        "file_read" => {
            let url = format!(
                "{}/fs/read?path={}&root_index={}",
                base,
                urlencoding::encode(path),
                root_index
            );
            let res = client
                .get(&url)
                .header("Authorization", format!("Bearer {}", bearer))
                .send()
                .await?;
            if !res.status().is_success() {
                anyhow::bail!("file_read http {}", res.status());
            }
            let body: Value = res.json().await?;
            Ok(ExecOk::Json(body))
        }
        "file_write" => {
            let b64 = content_b64.unwrap_or("");
            let url = format!("{}/fs/write", base);
            let res = client
                .post(&url)
                .header("Authorization", format!("Bearer {}", bearer))
                .header("X-Gaialynk-Confirmed", "true")
                .json(&json!({ "path": path, "content_base64": b64, "root_index": root_index }))
                .send()
                .await?;
            if !res.status().is_success() {
                anyhow::bail!("file_write http {}", res.status());
            }
            Ok(ExecOk::Empty)
        }
        _ => anyhow::bail!("unknown desktop_execute action {}", action),
    }
}

const EXECUTE_RESULT_ATTEMPTS: usize = 4;
const EXECUTE_RESULT_BACKOFF_BASE_MS: u64 = 400;

async fn post_execute_result_with_retries(
    client: &reqwest::Client,
    mainline_base: &str,
    device_token: &str,
    request_id: &str,
    ok: bool,
    result: Option<Value>,
    error: Option<String>,
) {
    let url = format!(
        "{}/api/v1/connectors/desktop/execute-result",
        mainline_base.trim_end_matches('/')
    );
    let body = json!({
        "request_id": request_id,
        "ok": ok,
        "result": result,
        "error": error,
    });
    for attempt in 0..EXECUTE_RESULT_ATTEMPTS {
        let res = match client
            .post(&url)
            .header(
                "Authorization",
                format!("Bearer {}", device_token),
            )
            .json(&body)
            .send()
            .await
        {
            Ok(r) => r,
            Err(e) => {
                eprintln!(
                    "[gaialynk-connector mainline-ws] execute-result request_id={} attempt {}/{} network error: {e}",
                    request_id,
                    attempt + 1,
                    EXECUTE_RESULT_ATTEMPTS
                );
                if attempt + 1 < EXECUTE_RESULT_ATTEMPTS {
                    tokio::time::sleep(Duration::from_millis(
                        EXECUTE_RESULT_BACKOFF_BASE_MS * (1u64 << attempt),
                    ))
                    .await;
                }
                continue;
            }
        };
        let status = res.status();
        if status.is_success() || status == reqwest::StatusCode::CONFLICT {
            // 主线已结算（重复 request_id）；本地 + Redis 双投递时常见
            return;
        }
        let bytes = res.bytes().await.unwrap_or_default();
        let snip = String::from_utf8_lossy(&bytes[..bytes.len().min(240)]);
        eprintln!(
            "[gaialynk-connector mainline-ws] execute-result request_id={} attempt {}/{} http {} {}",
            request_id,
            attempt + 1,
            EXECUTE_RESULT_ATTEMPTS,
            status,
            snip
        );
        if attempt + 1 < EXECUTE_RESULT_ATTEMPTS {
            tokio::time::sleep(Duration::from_millis(
                EXECUTE_RESULT_BACKOFF_BASE_MS * (1u64 << attempt),
            ))
            .await;
        }
    }
    eprintln!(
        "[gaialynk-connector mainline-ws] execute-result request_id={} giving up after {} attempts",
        request_id, EXECUTE_RESULT_ATTEMPTS
    );
}

async fn process_one_desktop_execute(
    client: &reqwest::Client,
    shared: &SharedState,
    device_token: &str,
    local_base: &str,
    request_id: &str,
    action: &str,
    path: &str,
    root_index: u32,
    content_b64: Option<&str>,
) {
    let mainline_base = {
        let st = shared.read().await;
        st.config.mainline_base_url.clone()
    };

    let exec = handle_desktop_execute_local(
        client,
        local_base,
        device_token,
        action,
        path,
        root_index,
        content_b64,
    )
    .await;

    let (ok, result, error) = match exec {
        Ok(ExecOk::Json(val)) => (true, Some(val), None),
        Ok(ExecOk::Empty) => (true, Some(json!({ "written": true })), None),
        Err(e) => (false, None, Some(e.to_string())),
    };

    post_execute_result_with_retries(
        client,
        &mainline_base,
        device_token,
        request_id,
        ok,
        result,
        error,
    )
    .await;
}

/// WebSocket 文本帧：`desktop_execute`
async fn handle_ws_text_desktop_execute(
    client: &reqwest::Client,
    shared: &SharedState,
    device_token: &str,
    my_device_id: &str,
    local_base: &str,
    text: &str,
) {
    let v: Value = match serde_json::from_str(text) {
        Ok(x) => x,
        Err(_) => return,
    };
    let Some(ty) = v.get("type").and_then(|x| x.as_str()) else {
        return;
    };
    if ty != "desktop_execute" {
        return;
    }
    // 主线 JSON 中的 UUID 与本地持久化可能大小写不一致；不一致时若严格相等会静默丢帧 → 任务永不结算。
    let Some(msg_device) = v.get("device_id").and_then(|x| x.as_str()) else {
        return;
    };
    if !msg_device.eq_ignore_ascii_case(my_device_id) {
        return;
    }
    let Some(request_id) = v.get("request_id").and_then(|x| x.as_str()) else {
        return;
    };
    let action = v.get("action").and_then(|x| x.as_str()).unwrap_or("");
    let path = v.get("path").and_then(|x| x.as_str()).unwrap_or("");
    let content_b64 = v.get("content_base64").and_then(|x| x.as_str());
    let root_index = v
        .get("root_index")
        .and_then(|x| x.as_u64())
        .map(|n| n as u32)
        .unwrap_or(0);

    process_one_desktop_execute(
        client,
        shared,
        device_token,
        local_base,
        request_id,
        action,
        path,
        root_index,
        content_b64,
    )
    .await;
}

/// 重连后 HTTP 补拉仍 pending 的任务（与 WS `desktop_execute` 同形）。
async fn fetch_and_process_pending_executes(
    client: &reqwest::Client,
    shared: &SharedState,
    device_token: &str,
    my_device_id: &str,
    local_base: &str,
) {
    let mainline_base = {
        let st = shared.read().await;
        st.config.mainline_base_url.clone()
    };
    let url = format!(
        "{}/api/v1/connectors/desktop/pending-executes",
        mainline_base.trim_end_matches('/')
    );
    let res = match client
        .get(&url)
        .header("Authorization", format!("Bearer {}", device_token))
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            eprintln!("[gaialynk-connector mainline-ws] pending-executes request failed: {e}");
            return;
        }
    };
    if !res.status().is_success() {
        eprintln!(
            "[gaialynk-connector mainline-ws] pending-executes http {}",
            res.status()
        );
        return;
    }
    let body: Value = match res.json().await {
        Ok(b) => b,
        Err(e) => {
            eprintln!("[gaialynk-connector mainline-ws] pending-executes json: {e}");
            return;
        }
    };
    let Some(items) = body
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|x| x.as_array())
    else {
        return;
    };
    if items.is_empty() {
        return;
    }
    eprintln!(
        "[gaialynk-connector mainline-ws] pending-executes: processing {} job(s) after (re)connect",
        items.len()
    );
    for item in items {
        let Some(request_id) = item.get("request_id").and_then(|x| x.as_str()) else {
            continue;
        };
        let action = item.get("action").and_then(|x| x.as_str()).unwrap_or("");
        let path = item.get("path").and_then(|x| x.as_str()).unwrap_or("");
        let content_b64 = item.get("content_base64").and_then(|x| x.as_str());
        let root_index = item
            .get("root_index")
            .and_then(|x| x.as_u64())
            .map(|n| n as u32)
            .unwrap_or(0);
        if item
            .get("device_id")
            .and_then(|x| x.as_str())
            .is_some_and(|id| !id.eq_ignore_ascii_case(my_device_id))
        {
            continue;
        }
        let client = client.clone();
        let shared = shared.clone();
        let device_token = device_token.to_string();
        let local_base = local_base.to_string();
        let request_id = request_id.to_string();
        let action = action.to_string();
        let path = path.to_string();
        let content_b64 = content_b64.map(|s| s.to_string());
        tokio::spawn(async move {
            process_one_desktop_execute(
                &client,
                &shared,
                &device_token,
                &local_base,
                &request_id,
                &action,
                &path,
                root_index,
                content_b64.as_deref(),
            )
            .await;
        });
    }
}

/// 多副本 / Redis 扇出偶发丢帧时，仅靠 WS 文本帧可能收不到 `desktop_execute`；定时补拉 pending 与重连后补拉形成双保险。
const PENDING_EXECUTES_POLL_SECS: u64 = 20;

/// 与 WebSocket 无关的 HTTP 补拉间隔：当 `wss` 因网络/代理/证书无法建立时，`run_one_ws_session` 根本不会运行，
/// 原先仅在 WS 会话内的 pending 轮询也永远不会执行 → 本机读盘任务一直 pending 直到主线超时。
const PENDING_EXECUTES_HTTP_POLL_SECS: u64 = 8;

async fn run_one_ws_session(
    shared: &SharedState,
    device_token: &str,
    my_device_id: &str,
    local_base: &str,
    ws_url: Url,
) -> anyhow::Result<()> {
    let (mut ws, _) = tokio_tungstenite::connect_async(ws_url.as_str()).await?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(90))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());

    fetch_and_process_pending_executes(
        &client,
        shared,
        device_token,
        my_device_id,
        local_base,
    )
    .await;

    let mut interval = tokio::time::interval(Duration::from_secs(PENDING_EXECUTES_POLL_SECS));
    interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
    interval.tick().await;

    loop {
        tokio::select! {
            _ = interval.tick() => {
                fetch_and_process_pending_executes(
                    &client,
                    shared,
                    device_token,
                    my_device_id,
                    local_base,
                )
                .await;
            }
            msg = ws.next() => {
                let Some(msg) = msg else { break };
                let msg = msg?;
                match msg {
                    Message::Text(t) => {
                        let text = t.to_string();
                        let client = client.clone();
                        let shared = shared.clone();
                        let device_token = device_token.to_string();
                        let my_device_id = my_device_id.to_string();
                        let local_base = local_base.to_string();
                        tokio::spawn(async move {
                            handle_ws_text_desktop_execute(
                                &client,
                                &shared,
                                &device_token,
                                &my_device_id,
                                &local_base,
                                &text,
                            )
                            .await;
                        });
                    }
                    Message::Ping(p) => {
                        let _ = ws.send(Message::Pong(p)).await;
                    }
                    Message::Close(_) => break,
                    _ => {}
                }
            }
        }
    }
    Ok(())
}

/// 只要已配对且本机 API 就绪，即周期性 `GET .../pending-executes`，不依赖 WebSocket 是否连通。
pub async fn pending_executes_over_http_loop(shared: SharedState) {
    loop {
        tokio::time::sleep(Duration::from_secs(PENDING_EXECUTES_HTTP_POLL_SECS)).await;
        let (token_opt, device_id_opt, local_opt) = {
            let st = shared.read().await;
            (
                st.config.device_token.clone(),
                st.config.device_id.clone(),
                st.local_api_base.clone(),
            )
        };
        let (Some(token), Some(device_id), Some(local_base)) = (token_opt, device_id_opt, local_opt) else {
            continue;
        };
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(90))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        fetch_and_process_pending_executes(&client, &shared, &token, &device_id, local_base.as_str()).await;
    }
}

pub async fn mainline_ws_loop(shared: SharedState) {
    loop {
        let (token_opt, device_id_opt, mainline_base, local_opt) = {
            let st = shared.read().await;
            (
                st.config.device_token.clone(),
                st.config.device_id.clone(),
                st.config.mainline_base_url.clone(),
                st.local_api_base.clone(),
            )
        };

        let (Some(token), Some(device_id), Some(local_base)) = (token_opt, device_id_opt, local_opt) else {
            tokio::time::sleep(Duration::from_secs(2)).await;
            continue;
        };

        let ws_url = match build_desktop_ws_url(&mainline_base, &token) {
            Ok(u) => u,
            Err(e) => {
                eprintln!("[gaialynk-connector mainline-ws] invalid URL: {e}");
                tokio::time::sleep(Duration::from_secs(5)).await;
                continue;
            }
        };

        match run_one_ws_session(&shared, &token, &device_id, local_base.as_str(), ws_url).await {
            Ok(()) => {}
            Err(e) => eprintln!("[gaialynk-connector mainline-ws] disconnected: {e}"),
        }
        tokio::time::sleep(Duration::from_secs(2)).await;
    }
}
