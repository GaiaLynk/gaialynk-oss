//! 主网 `GET .../connectors/desktop/ws` 客户端：消费 `desktop_execute`，经本机 `local_server` 执行后 `POST .../execute-result`（路线图阶段 B）。

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

async fn post_execute_result(
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
    let _ = client
        .post(url)
        .header(
            "Authorization",
            format!("Bearer {}", device_token),
        )
        .json(&json!({
            "request_id": request_id,
            "ok": ok,
            "result": result,
            "error": error,
        }))
        .send()
        .await;
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
    while let Some(msg) = ws.next().await {
        let msg = msg?;
        match msg {
            Message::Text(t) => {
                let v: Value = match serde_json::from_str(&t) {
                    Ok(x) => x,
                    Err(_) => continue,
                };
                let Some(ty) = v.get("type").and_then(|x| x.as_str()) else {
                    continue;
                };
                if ty != "desktop_execute" {
                    continue;
                }
                if v.get("device_id").and_then(|x| x.as_str()) != Some(my_device_id) {
                    continue;
                }
                let Some(request_id) = v.get("request_id").and_then(|x| x.as_str()) else {
                    continue;
                };
                let action = v.get("action").and_then(|x| x.as_str()).unwrap_or("");
                let path = v.get("path").and_then(|x| x.as_str()).unwrap_or("");
                let content_b64 = v.get("content_base64").and_then(|x| x.as_str());
                let root_index = v
                    .get("root_index")
                    .and_then(|x| x.as_u64())
                    .map(|n| n as u32)
                    .unwrap_or(0);

                let mainline_base = {
                    let st = shared.read().await;
                    st.config.mainline_base_url.clone()
                };

                let exec = handle_desktop_execute_local(
                    &client,
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

                post_execute_result(
                    &client,
                    &mainline_base,
                    device_token,
                    request_id,
                    ok,
                    result,
                    error,
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
