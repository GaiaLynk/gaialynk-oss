//! 托盘菜单文案（与前端 `packages/connector/src/i18n/messages.ts` 中对应条目保持一致）。

pub fn normalize_locale(raw: &str) -> &'static str {
    match raw.trim() {
        "zh-Hans" => "zh-Hans",
        "zh-Hant" => "zh-Hant",
        "en" => "en",
        _ => "en",
    }
}

/// (显示窗口, 检查更新, 退出)
pub fn labels_for(locale: &str) -> (&'static str, &'static str, &'static str) {
    match normalize_locale(locale) {
        "zh-Hans" => ("显示窗口", "检查更新", "退出"),
        "zh-Hant" => ("顯示視窗", "檢查更新", "結束"),
        _ => ("Show window", "Check for updates", "Quit"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn labels_match_locale() {
        assert_eq!(
            labels_for("zh-Hans"),
            ("显示窗口", "检查更新", "退出")
        );
        assert_eq!(
            labels_for("en"),
            ("Show window", "Check for updates", "Quit")
        );
    }

    #[test]
    fn unknown_falls_back_to_en() {
        assert_eq!(normalize_locale("fr"), "en");
        assert_eq!(
            labels_for("xx"),
            ("Show window", "Check for updates", "Quit")
        );
    }
}
