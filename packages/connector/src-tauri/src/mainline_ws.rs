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
        if status.is_success() {
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
    if v.get("device_id").and_then(|x| x.as_str()) != Some(my_device_id) {
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
            .is_some_and(|id| id != my_device_id)
        {
            continue;
        }
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
}

async fn run_one_ws_session(
    shared: &SharedState,
    device_token: &str,
    my_device_id: &str,
    local_base: &str,
    ws_url: Url,
) -> anyhow::Result<()> {
    let (mut ws, _) = tokio_tungstenite::connect_async(ws_url.as_str()).await?;
    let client = reqwest::Client::new();

    fetch_and_process_pending_executes(
        &client,
        shared,
        device_token,
        my_device_id,
        local_base,
    )
    .await;

    while let Some(msg) = ws.next().await {
        let msg = msg?;
        match msg {
            Message::Text(t) => {
                handle_ws_text_desktop_execute(
                    &client,
                    shared,
                    device_token,
                    my_device_id,
                    local_base,
                    &t,
                )
                .await;
            }
            Message::Ping(p) => {
                let _ = ws.send(Message::Pong(p)).await;
            }
            Message::Close(_) => break,
            _ => {}
        }
    }
    Ok(())
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
