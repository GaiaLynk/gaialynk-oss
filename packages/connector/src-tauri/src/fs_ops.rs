//! 挂载根目录内的文件操作；`canonicalize` + 前缀校验防御 path traversal。

use serde::Serialize;
use std::fs;
use std::path::{Component, Path, PathBuf};
use thiserror::Error;

pub const MAX_READ_BYTES: u64 = 10 * 1024 * 1024;

#[derive(Debug, Error)]
pub enum FsError {
    #[error("no mounted workspace roots")]
    NoMounts,
    #[error("path outside mounted roots")]
    OutsideMounts,
    #[error("invalid or inaccessible path")]
    InvalidPath,
    #[error("path is not a directory")]
    NotDirectory,
    #[error("path is not a file")]
    NotFile,
    #[error("file too large to read (max {MAX_READ_BYTES} bytes)")]
    TooLarge,
    #[error("write not confirmed")]
    WriteNotConfirmed,
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
}

/// [`read_file_smart`]：单文件，或同目录同 stem 命中多文件时一并读出。
#[derive(Debug)]
pub enum SmartReadOutcome {
    Single(PathBuf, Vec<u8>),
    /// 相对挂载根路径（`/`）与 UTF-8 文件字节
    Multi(Vec<(String, Vec<u8>)>),
}

#[derive(Debug, Serialize)]
pub struct DirEntryJson {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
}

/// 将用户传入的 `path` 解析到某一挂载根之下（`canonicalize` 后必须仍为根前缀）。
/// 运行时代码优先使用 [`resolve_within_roots_at_index`]；本函数仍用于单元测试与多根探测。
#[allow(dead_code)]
pub fn resolve_within_roots(roots: &[PathBuf], user_path: &str) -> Result<PathBuf, FsError> {
    if roots.is_empty() {
        return Err(FsError::NoMounts);
    }
    let trimmed = user_path.trim();
    for root in roots {
        let root_canon = root.canonicalize().map_err(|_| FsError::InvalidPath)?;
        let candidate = if trimmed.is_empty() {
            root_canon.clone()
        } else if Path::new(trimmed).is_absolute() {
            PathBuf::from(trimmed)
        } else {
            root_canon.join(trimmed.trim_start_matches(|c: char| c == '/' || c == '\\'))
        };
        let canon = candidate.canonicalize().map_err(|_| FsError::InvalidPath)?;
        if is_same_or_child(&root_canon, &canon) {
            return Ok(canon);
        }
    }
    Err(FsError::OutsideMounts)
}

/// 仅针对 `root_index` 指向的那一根挂载根解析（与主线 `desktop_execute.root_index` 对齐）。
pub fn resolve_within_roots_at_index(
    roots: &[PathBuf],
    root_index: usize,
    user_path: &str,
) -> Result<PathBuf, FsError> {
    if roots.is_empty() {
        return Err(FsError::NoMounts);
    }
    let Some(root) = roots.get(root_index) else {
        return Err(FsError::OutsideMounts);
    };
    let root_canon = root.canonicalize().map_err(|_| FsError::InvalidPath)?;
    let trimmed = user_path.trim();
    let candidate = if trimmed.is_empty() {
        root_canon.clone()
    } else if Path::new(trimmed).is_absolute() {
        PathBuf::from(trimmed)
    } else {
        root_canon.join(trimmed.trim_start_matches(|c: char| c == '/' || c == '\\'))
    };
    let canon = candidate.canonicalize().map_err(|_| FsError::InvalidPath)?;
    if is_same_or_child(&root_canon, &canon) {
        Ok(canon)
    } else {
        Err(FsError::OutsideMounts)
    }
}

/// 用于 `file_write`：目标文件可以尚不存在（新建）。对已有路径段逐级 `canonicalize` 以防 symlink 逃逸；
/// 一旦遇到尚不存在的路径前缀，将剩余段一次性拼上，并保证仍位于挂载根之下。
pub fn resolve_within_roots_at_index_for_write(
    roots: &[PathBuf],
    root_index: usize,
    user_path: &str,
) -> Result<PathBuf, FsError> {
    if roots.is_empty() {
        return Err(FsError::NoMounts);
    }
    let Some(root) = roots.get(root_index) else {
        return Err(FsError::OutsideMounts);
    };
    let root_canon = root.canonicalize().map_err(|_| FsError::InvalidPath)?;
    let trimmed = user_path.trim();
    if trimmed.is_empty() {
        return Err(FsError::InvalidPath);
    }
    let rel = Path::new(trimmed);
    if rel.is_absolute() {
        return Err(FsError::OutsideMounts);
    }
    let mut parts: Vec<std::ffi::OsString> = Vec::new();
    for c in rel.components() {
        match c {
            Component::Normal(name) => parts.push(name.to_os_string()),
            Component::ParentDir => return Err(FsError::OutsideMounts),
            Component::CurDir => {}
            _ => return Err(FsError::OutsideMounts),
        }
    }
    if parts.is_empty() {
        return Err(FsError::InvalidPath);
    }
    let n = parts.len();
    let mut cur = root_canon.clone();
    for i in 0..n {
        cur.push(&parts[i]);
        if i == n - 1 {
            if !cur.starts_with(&root_canon) {
                return Err(FsError::OutsideMounts);
            }
            return Ok(cur);
        }
        if !cur.exists() {
            for j in i + 1..n {
                cur.push(&parts[j]);
            }
            if !cur.starts_with(&root_canon) {
                return Err(FsError::OutsideMounts);
            }
            return Ok(cur);
        }
        if !cur.is_dir() {
            return Err(FsError::InvalidPath);
        }
        cur = cur.canonicalize().map_err(|_| FsError::InvalidPath)?;
        if !cur.starts_with(&root_canon) {
            return Err(FsError::OutsideMounts);
        }
    }
    Err(FsError::InvalidPath)
}

fn is_same_or_child(root: &Path, child: &Path) -> bool {
    child.starts_with(root)
}

pub fn list_dir(path: &Path) -> Result<Vec<DirEntryJson>, FsError> {
    if !path.is_dir() {
        return Err(FsError::NotDirectory);
    }
    let mut out = Vec::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let meta = entry.metadata()?;
        let name = entry.file_name().to_string_lossy().into_owned();
        out.push(DirEntryJson {
            name,
            is_dir: meta.is_dir(),
            size: meta.len(),
        });
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(out)
}

pub fn read_file_bounded(path: &Path) -> Result<Vec<u8>, FsError> {
    if !path.is_file() {
        return Err(FsError::NotFile);
    }
    let len = path.metadata()?.len();
    if len > MAX_READ_BYTES {
        return Err(FsError::TooLarge);
    }
    Ok(fs::read(path)?)
}

/// 相对挂载根的路径变体：原路径 + 若末段无扩展名则追加常见扩展（优先 `.md`）。
fn candidate_relative_paths(user_path: &str) -> Result<Vec<String>, FsError> {
    let t = user_path.trim();
    if t.is_empty() {
        return Err(FsError::InvalidPath);
    }
    let path = Path::new(t);
    let mut out = vec![t.to_string()];
    let name = path.file_name().and_then(|s| s.to_str());
    let Some(name) = name else {
        return Ok(out);
    };
    if !name.contains('.') {
        for ext in ["md", "markdown", "txt", "mdx", "json"] {
            let p2 = path.with_extension(ext);
            out.push(p2.to_string_lossy().replace('\\', "/"));
        }
    }
    Ok(out)
}

/// 精确与扩展名尝试均失败后：在同目录按 stem（不区分大小写）匹配；多文件则全部读取。
fn stem_reads_in_parent(
    roots: &[PathBuf],
    root_index: usize,
    user_path: &str,
) -> Result<SmartReadOutcome, FsError> {
    let t = user_path.trim();
    let path = Path::new(t);
    let parent_rel = path.parent().map_or_else(String::new, |p| {
        let s = p.to_string_lossy();
        let ss = s.trim();
        if ss.is_empty() {
            String::new()
        } else {
            ss.replace('\\', "/")
        }
    });
    let stem_key = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
    if stem_key.is_empty() {
        return Err(FsError::NotFile);
    }
    let dir_path = resolve_within_roots_at_index(roots, root_index, &parent_rel)?;
    if !dir_path.is_dir() {
        return Err(FsError::NotFile);
    }
    let entries = list_dir(&dir_path)?;
    let mut matches: Vec<String> = Vec::new();
    for e in entries.iter().filter(|e| !e.is_dir) {
        let est = Path::new(&e.name)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_lowercase();
        if est == stem_key {
            matches.push(e.name.clone());
        }
    }
    matches.sort();
    match matches.len() {
        0 => Err(FsError::NotFile),
        1 => {
            let rel_joined = if parent_rel.is_empty() {
                matches[0].clone()
            } else {
                format!("{}/{}", parent_rel.trim_end_matches('/'), matches[0])
            };
            let p = resolve_within_roots_at_index_for_write(roots, root_index, &rel_joined)?;
            let bytes = read_file_bounded(&p)?;
            Ok(SmartReadOutcome::Single(p, bytes))
        }
        _ => {
            const MAX_MULTI_FILES: usize = 64;
            let mut out: Vec<(String, Vec<u8>)> = Vec::new();
            let mut total: u64 = 0;
            for name in matches.iter().take(MAX_MULTI_FILES) {
                let rel_joined = if parent_rel.is_empty() {
                    name.clone()
                } else {
                    format!("{}/{}", parent_rel.trim_end_matches('/'), name)
                };
                let p = resolve_within_roots_at_index_for_write(roots, root_index, &rel_joined)?;
                let bytes = read_file_bounded(&p)?;
                total += bytes.len() as u64;
                if total > MAX_READ_BYTES.saturating_mul(10) {
                    return Err(FsError::TooLarge);
                }
                out.push((rel_joined, bytes));
            }
            Ok(SmartReadOutcome::Multi(out))
        }
    }
}

/// 先按精确路径与常见扩展名尝试；仍失败则在同目录按 stem 匹配（多文件则全部读出）。
pub fn read_file_smart(
    roots: &[PathBuf],
    root_index: usize,
    user_path: &str,
) -> Result<SmartReadOutcome, FsError> {
    let candidates = candidate_relative_paths(user_path)?;
    for rel in candidates {
        let p = resolve_within_roots_at_index_for_write(roots, root_index, &rel)?;
        match read_file_bounded(&p) {
            Ok(bytes) => return Ok(SmartReadOutcome::Single(p, bytes)),
            Err(FsError::NotFile) => continue,
            Err(e) => return Err(e),
        }
    }
    stem_reads_in_parent(roots, root_index, user_path)
}

pub fn write_file(path: &Path, bytes: &[u8], write_confirmed: bool) -> Result<(), FsError> {
    if !write_confirmed {
        return Err(FsError::WriteNotConfirmed);
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, bytes)?;
    Ok(())
}

pub fn path_hash(path: &Path) -> String {
    use sha2::{Digest, Sha256};
    let s = path.to_string_lossy();
    let mut h = Sha256::new();
    h.update(s.as_bytes());
    hex::encode(h.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;

    #[test]
    fn rejects_traversal_outside_root() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(&safe).unwrap();
        let roots = vec![safe.clone()];
        let evil = resolve_within_roots(&roots, "../");
        assert!(matches!(evil, Err(FsError::OutsideMounts)));
    }

    #[test]
    fn allows_file_under_root() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(&safe).unwrap();
        let f = safe.join("a.txt");
        File::create(&f).unwrap().write_all(b"x").unwrap();
        let roots = vec![safe.clone()];
        let p = resolve_within_roots(&roots, "a.txt").unwrap();
        assert_eq!(p, f.canonicalize().unwrap());
    }

    #[test]
    fn write_resolve_allows_new_file_at_root() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(&safe).unwrap();
        let root = safe.canonicalize().unwrap();
        let roots = vec![safe];
        let p = resolve_within_roots_at_index_for_write(&roots, 0, "GaiaLynk-New.md").unwrap();
        assert_eq!(p, root.join("GaiaLynk-New.md"));
        assert!(!p.exists());
    }

    #[test]
    fn write_resolve_allows_nested_new_file() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(&safe).unwrap();
        let root = safe.canonicalize().unwrap();
        let roots = vec![safe];
        let p = resolve_within_roots_at_index_for_write(&roots, 0, "a/b/new.txt").unwrap();
        assert_eq!(p, root.join("a/b/new.txt"));
        assert!(!p.exists());
    }

    #[test]
    fn write_resolve_rejects_parent_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(&safe).unwrap();
        let roots = vec![safe];
        let r = resolve_within_roots_at_index_for_write(&roots, 0, "../evil.txt");
        assert!(matches!(r, Err(FsError::OutsideMounts)));
    }

    #[test]
    fn read_file_smart_appends_md_when_no_extension() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(&safe).unwrap();
        let f = safe.join("Plan.md");
        File::create(&f).unwrap().write_all(b"hello").unwrap();
        let roots = vec![safe];
        match read_file_smart(&roots, 0, "Plan").unwrap() {
            SmartReadOutcome::Single(p, bytes) => {
                assert!(p.ends_with("Plan.md"));
                assert_eq!(bytes, b"hello");
            }
            _ => panic!("expected single"),
        }
    }

    #[test]
    fn read_file_smart_matches_unique_stem_in_subdir() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(safe.join("docs")).unwrap();
        let f = safe.join("docs/Only.md");
        File::create(&f).unwrap().write_all(b"x").unwrap();
        let roots = vec![safe];
        match read_file_smart(&roots, 0, "docs/Only").unwrap() {
            SmartReadOutcome::Single(_, bytes) => assert_eq!(bytes, b"x"),
            _ => panic!("expected single"),
        }
    }

    #[test]
    fn read_file_smart_reads_all_same_stem_when_extensions_miss() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(safe.join("mix")).unwrap();
        File::create(safe.join("mix/w.pdf"))
            .unwrap()
            .write_all(b"a")
            .unwrap();
        File::create(safe.join("mix/w.doc"))
            .unwrap()
            .write_all(b"b")
            .unwrap();
        let roots = vec![safe];
        match read_file_smart(&roots, 0, "mix/w").unwrap() {
            SmartReadOutcome::Multi(parts) => {
                assert_eq!(parts.len(), 2);
                let mut keys: Vec<_> = parts.iter().map(|(r, _)| r.as_str()).collect();
                keys.sort();
                assert!(keys.iter().any(|k| k.ends_with("w.doc")));
                assert!(keys.iter().any(|k| k.ends_with("w.pdf")));
            }
            _ => panic!("expected multi"),
        }
    }
}
