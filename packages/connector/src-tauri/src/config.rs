//! 本地持久化配置（挂载根、主网 URL、device 凭据）。

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use crate::pairing;

/// 官网 `www` / apex 域名不提供 `/api/v1/*`（该路径在主线 Hono 上）。用户常误填浏览器地址栏，此处纠偏为对外 API 域。
pub fn normalize_mainline_base_url(raw: &str) -> String {
    let s = raw.trim().trim_end_matches('/').to_string();
    let lower = s.to_lowercase();
    if matches!(
        lower.as_str(),
        "https://www.gaialynk.com"
            | "http://www.gaialynk.com"
            | "https://gaialynk.com"
            | "http://gaialynk.com"
    ) {
        return "https://api.gaialynk.com".to_string();
    }
    s
}

fn default_ui_locale() -> String {
    "en".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistedConfig {
    pub mainline_base_url: String,
    pub pairing_code: String,
    pub device_token: Option<String>,
    pub device_secret: Option<String>,
    pub device_id: Option<String>,
    pub mounted_roots: Vec<String>,
    pub allowed_web_origins: Vec<String>,
    /// 界面 / 托盘语言：`en` | `zh-Hans` | `zh-Hant`（与前端 `gaialynk.connector.locale` 对齐）
    #[serde(default = "default_ui_locale")]
    pub ui_locale: String,
}

impl Default for PersistedConfig {
    fn default() -> Self {
        let mainline = std::env::var("GAIALYNK_MAINLINE_URL")
            .unwrap_or_else(|_| "http://127.0.0.1:3000".to_string());
        Self {
            mainline_base_url: mainline,
            pairing_code: pairing::generate_numeric_pairing_code(),
            device_token: None,
            device_secret: None,
            device_id: None,
            mounted_roots: Vec::new(),
            allowed_web_origins: vec![
                "http://localhost:3000".to_string(),
                "http://127.0.0.1:3000".to_string(),
                "http://localhost:1420".to_string(),
                "http://127.0.0.1:1420".to_string(),
            ],
            ui_locale: default_ui_locale(),
        }
    }
}

pub fn config_path() -> PathBuf {
    if let Some(p) = ProjectDirs::from("com", "GaiaLynk", "Connector") {
        return p.config_dir().join("config.json");
    }
    std::env::temp_dir().join("gaialynk-connector-config.json")
}

pub fn load() -> PersistedConfig {
    let path = config_path();
    if let Ok(bytes) = std::fs::read(&path) {
        if let Ok(mut c) = serde_json::from_slice::<PersistedConfig>(&bytes) {
            let norm = normalize_mainline_base_url(&c.mainline_base_url);
            if norm != c.mainline_base_url {
                c.mainline_base_url = norm;
                let _ = save(&c);
            }
            return c;
        }
    }
    let c = PersistedConfig::default();
    let _ = save(&c);
    c
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserializes_legacy_config_without_ui_locale() {
        let json = r#"{"mainline_base_url":"http://x","pairing_code":"123456","device_token":null,"device_secret":null,"device_id":null,"mounted_roots":[],"allowed_web_origins":[]}"#;
        let c: PersistedConfig = serde_json::from_str(json).unwrap();
        assert_eq!(c.ui_locale, "en");
    }
}

pub fn save(c: &PersistedConfig) -> anyhow::Result<()> {
    let path = config_path();
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, serde_json::to_vec_pretty(c)?)?;
    std::fs::rename(&tmp, &path)?;
    Ok(())
}
