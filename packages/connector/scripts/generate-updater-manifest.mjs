#!/usr/bin/env node
/**
 * 生成 Tauri v2 静态更新清单（latest.json），用于 GitHub Releases 等 CDN。
 * 规范：https://v2.tauri.app/plugin/updater/
 *
 * 用法：
 *   node generate-updater-manifest.mjs --version 0.2.0 --input manifest-input.json --out latest.json
 *
 * manifest-input.json 示例：
 * {
 *   "darwin-aarch64": { "url": "https://github.com/org/repo/releases/download/connector-v0.2.0/foo.tar.gz", "signature": "minisign..." },
 *   "darwin-x86_64": { "url": "...", "signatureFile": "path/to/foo.tar.gz.sig" },
 *   "windows-x86_64": { "url": "...", "signatureFile": "GaiaLynk Connector_0.2.0_x64-setup.exe.sig" }
 * }
 *
 * `signature` 为 .sig 文件**全文**（与 Tauri 文档一致）；也可用 `signatureFile` 从磁盘读取。
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

function usage() {
  console.error(`Usage: node generate-updater-manifest.mjs --version <semver> --input <json> [--out latest.json] [--notes text] [--pub-date RFC3339]`);
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    version: { type: "string" },
    input: { type: "string" },
    out: { type: "string", default: "latest.json" },
    notes: { type: "string", default: "" },
    "pub-date": { type: "string" },
  },
  allowPositionals: false,
});

if (!values.version || !values.input) usage();

const raw = readFileSync(values.input, "utf8");
/** @type {Record<string, { url?: string; signature?: string; signatureFile?: string }>} */
const partial = JSON.parse(raw);

const pubDate =
  values["pub-date"] ?? new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

/** @type {Record<string, { url: string; signature: string }>} */
const platforms = {};

for (const [key, entry] of Object.entries(partial)) {
  if (!entry?.url) {
    throw new Error(`platforms.${key}: missing url`);
  }
  let signature = entry.signature;
  if (!signature && entry.signatureFile) {
    const p = resolve(entry.signatureFile);
    signature = readFileSync(p, "utf8").trim();
  }
  if (!signature) {
    throw new Error(`platforms.${key}: need signature or signatureFile`);
  }
  platforms[key] = { url: entry.url, signature };
}

const manifest = {
  version: values.version.replace(/^v/i, ""),
  notes: values.notes,
  pub_date: pubDate,
  platforms,
};

writeFileSync(values.out, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.error(`Wrote ${values.out} (${Object.keys(platforms).length} platform(s))`);
