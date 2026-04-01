mod command_error;
mod config;
mod fs_ops;
mod local_server;
mod pairing;
mod tray_labels;

use std::sync::Arc;
use std::time::Duration;

use local_server::{ServerState, SharedState};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Emitter;
use tauri::Manager;
use tauri::AppHandle;

const DEVICE_SESSION_CHECK_SECS: u64 = 30;

#[derive(Clone)]
struct TrayMenuItems {
    show: MenuItem<tauri::Wry>,
    check_updates: MenuItem<tauri::Wry>,
    quit: MenuItem<tauri::Wry>,
}

#[tauri::command]
async fn set_ui_locale(
    state: tauri::State<'_, SharedState>,
    tray: tauri::State<'_, TrayMenuItems>,
    locale: String,
) -> Result<(), String> {
    let loc = tray_labels::normalize_locale(&locale).to_string();
    let (show_t, check_t, quit_t) = tray_labels::labels_for(&loc);
    tray
        .show
        .set_text(show_t)
        .map_err(|e| e.to_string())?;
    tray
        .check_updates
        .set_text(check_t)
        .map_err(|e| e.to_string())?;
    tray.quit.set_text(quit_t).map_err(|e| e.to_string())?;
    let mut st = state.write().await;
    st.config.ui_locale = loc;
    config::save(&st.config).map_err(|e| command_error::config_save_failed(e.to_string()))?;
    Ok(())
}

#[derive(Clone, serde::Serialize)]
struct StatusPayload {
    pairing_code: String,
    connected: bool,
    mainline_base_url: String,
    local_api_base: Option<String>,
    mounted_roots: Vec<String>,
    device_id: Option<String>,
}

#[tauri::command]
async fn get_status(state: tauri::State<'_, SharedState>) -> Result<StatusPayload, String> {
    let st = state.read().await;
    Ok(StatusPayload {
        pairing_code: st.config.pairing_code.clone(),
        connected: st.config.device_token.is_some(),
        mainline_base_url: st.config.mainline_base_url.clone(),
        local_api_base: st.local_api_base.clone(),
        mounted_roots: st.config.mounted_roots.clone(),
        device_id: st.config.device_id.clone(),
    })
}

#[tauri::command]
async fn set_mainline_base_url(
    state: tauri::State<'_, SharedState>,
    url: String,
) -> Result<String, String> {
    let mut st = state.write().await;
    let norm = config::normalize_mainline_base_url(&url);
    st.config.mainline_base_url = norm.clone();
    config::save(&st.config)
        .map_err(|e| command_error::config_save_failed(e.to_string()))?;
    Ok(norm)
}

#[tauri::command]
async fn regenerate_pairing_code(state: tauri::State<'_, SharedState>) -> Result<(), String> {
    let mut st = state.write().await;
    st.config.pairing_code = pairing::generate_numeric_pairing_code();
    st.config.device_token = None;
    st.config.device_secret = None;
    st.config.device_id = None;
    config::save(&st.config).map_err(|e| command_error::config_save_failed(e.to_string()))
}

#[tauri::command]
async fn add_mount_directory(
    app: tauri::AppHandle,
    state: tauri::State<'_, SharedState>,
) -> Result<(), String> {
    use tauri_plugin_dialog::DialogExt;
    {
        let st = state.read().await;
        if st.config.mounted_roots.len() >= 5 {
            return Err(command_error::mount_limit_reached());
        }
    }
    let h = app.clone();
    let picked = tokio::task::spawn_blocking(move || h.dialog().file().blocking_pick_folder())
        .await
        .map_err(|e| command_error::dialog_task_failed(e.to_string()))?;
    let Some(file_path) = picked else {
        return Ok(());
    };
    let path = file_path
        .into_path()
        .map_err(|e| command_error::path_resolve_failed(e.to_string()))?
        .to_string_lossy()
        .to_string();
    let mut st = state.write().await;
    if !st.config.mounted_roots.contains(&path) {
        st.config.mounted_roots.push(path);
    }
    config::save(&st.config).map_err(|e| command_error::config_save_failed(e.to_string()))
}

async fn pairing_poll_loop(shared: SharedState, app: AppHandle) {
    let client = reqwest::Client::new();
    loop {
        let token_snapshot = {
            let st = shared.read().await;
            st.config.device_token.clone()
        };

        if let Some(token) = token_snapshot {
            tokio::time::sleep(Duration::from_secs(DEVICE_SESSION_CHECK_SECS)).await;
            let base = {
                let st = shared.read().await;
                st.config.mainline_base_url.clone()
            };
            match pairing::fetch_device_session_active(&client, &base, &token).await {
                Ok(true) => {}
                Ok(false) => {
                    let cleared = {
                        let mut st = shared.write().await;
                        if st.config.device_token.as_ref() == Some(&token) {
                            st.config.device_token = None;
                            st.config.device_secret = None;
                            st.config.device_id = None;
                            config::save(&st.config).is_ok()
                        } else {
                            false
                        }
                    };
                    if cleared {
                        let _ = app.emit("connector-pairing-state", false);
                    }
                }
                Err(_) => { /* 网络故障：保留 token，下次再试 */ }
            }
            continue;
        }

        tokio::time::sleep(Duration::from_secs(2)).await;
        let (code, base) = {
            let st = shared.read().await;
            (st.config.pairing_code.clone(), st.config.mainline_base_url.clone())
        };
        let Ok(body) = pairing::fetch_pair_status(&client, &base, &code).await else {
            continue;
        };
        if !body.status.eq_ignore_ascii_case("completed") {
            continue;
        }
        let Some(t) = body.device_token else {
            continue;
        };
        let Some(s) = body.device_secret else {
            continue;
        };
        let Some(id) = body.device_id else {
            continue;
        };
        let mut st = shared.write().await;
        st.config.device_token = Some(t);
        st.config.device_secret = Some(s);
        st.config.device_id = Some(id);
        if config::save(&st.config).is_ok() {
            let _ = app.emit("connector-pairing-state", true);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let loaded = config::load();
    let initial_tray_locale = tray_labels::normalize_locale(&loaded.ui_locale).to_string();
    let shared: SharedState = Arc::new(tokio::sync::RwLock::new(ServerState {
        config: loaded,
        local_api_base: None,
    }));

    let s_srv = shared.clone();
    tauri::async_runtime::spawn(async move {
        local_server::run_server(s_srv).await;
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(shared.clone())
        .invoke_handler(tauri::generate_handler![
            get_status,
            set_mainline_base_url,
            regenerate_pairing_code,
            add_mount_directory,
            set_ui_locale,
        ])
        .setup(
            move |app: &mut tauri::App| -> Result<(), Box<dyn std::error::Error>> {
                let poll_h = app.handle().clone();
                let s_poll = shared.clone();
                tauri::async_runtime::spawn(async move {
                    pairing_poll_loop(s_poll, poll_h).await;
                });

                let handle = app.handle().clone();
                let (t_show, t_check, t_quit) = tray_labels::labels_for(&initial_tray_locale);
                let show = MenuItem::with_id(&handle, "show", t_show, true, None::<&str>)?;
                let check_updates =
                    MenuItem::with_id(&handle, "check-updates", t_check, true, None::<&str>)?;
                let quit = MenuItem::with_id(&handle, "quit", t_quit, true, None::<&str>)?;
                app.manage(TrayMenuItems {
                    show: show.clone(),
                    check_updates: check_updates.clone(),
                    quit: quit.clone(),
                });
                let menu = Menu::with_items(&handle, &[&show, &check_updates, &quit])?;
                let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png"))?;
                let _tray = TrayIconBuilder::with_id("main-tray")
                    .menu(&menu)
                    .icon(icon)
                    .show_menu_on_left_click(true)
                    .on_menu_event(move |app, event| match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "check-updates" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                            let _ = app.emit("connector-check-updates", ());
                        }
                        _ => {}
                    })
                    .build(&handle)?;
                Ok(())
            },
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
