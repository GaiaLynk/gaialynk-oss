//! 结构化命令错误，供前端按 `code` 做多语言映射（避免在 Rust 里写死自然语言）。

use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct CommandErrorJson {
    pub code: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

impl CommandErrorJson {
    pub fn to_invoke_string(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| r#"{"code":"UNKNOWN"}"#.to_string())
    }
}

pub fn mount_limit_reached() -> String {
    CommandErrorJson {
        code: "MOUNT_LIMIT_REACHED",
        detail: None,
    }
    .to_invoke_string()
}

pub fn config_save_failed(detail: String) -> String {
    CommandErrorJson {
        code: "CONFIG_SAVE_FAILED",
        detail: Some(detail),
    }
    .to_invoke_string()
}

pub fn dialog_task_failed(detail: String) -> String {
    CommandErrorJson {
        code: "DIALOG_TASK_FAILED",
        detail: Some(detail),
    }
    .to_invoke_string()
}

pub fn path_resolve_failed(detail: String) -> String {
    CommandErrorJson {
        code: "PATH_RESOLVE_FAILED",
        detail: Some(detail),
    }
    .to_invoke_string()
}
