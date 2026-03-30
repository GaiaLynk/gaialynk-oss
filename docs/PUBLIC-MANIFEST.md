# Public OSS mirror — allowed paths (whitelist)

This manifest defines what may appear in the **public** GaiaLynk OSS repository.
Everything else in this monorepo is **out of scope** for that mirror unless this
document and `config/public-oss-manifest.json` are updated together.

**Strategy (CTO):** open **standards + minimal trusted surface + Connector**;
keep **scale + full product + commercial stack** in this private monorepo only.

## Machine-readable list

Authoritative paths for automation: **`config/public-oss-manifest.json`**.

Sync command (**run from the private monorepo**; the script does not ship in the
public clone):

```bash
export PUBLIC_OSS_MIRROR_DIR=/path/to/public-repo-clone
node scripts/sync-public-oss-mirror.mjs
```

## What the public mirror includes

### Code (MIT)

- `packages/connector/` — Desktop Connector (Tauri + local protocol surface).
- `packages/shared/` — Shared TS modules shipped alongside OSS (keep small).

### Public-facing documentation (MIT)

- `docs/Agent-IM-Vision.md`
- `docs/Agent-IM-Public-Roadmap-Vision.md`
- `docs/Agent-IM-Reading-Path.md`
- `docs/Desktop-Connector-Threat-Model-v1.md`
- `docs/Connector-Release-Guide-v1.md`
- `docs/contracts/README.md`
- `docs/contracts/mainline-api-contract-baseline.v1.json` — API contract baseline for integrators (review for sensitivity when updating).

### Root files in the mirror (see `rootFiles` in JSON)

- `README.md` — from `docs/oss-mirror/README.md` (public-facing).
- `CONTRIBUTING.md` — from `docs/oss-mirror/CONTRIBUTING.md`.
- `LICENSE`, `NOTICE`, `SECURITY.md`, `CODE_OF_CONDUCT.md`
- `docs/LICENSING.md`, `docs/PUBLIC-MANIFEST.md`
- `.github/workflows/ci.yml` — OSS-only Connector CI (`docs/oss-mirror/.../oss-connector-ci.yml`).
- `.github/workflows/connector-release.yml` — tag-driven Connector releases.
- Selected issue templates and PR template.

## Explicitly **not** in the public mirror

Unless you intentionally expand the whitelist:

- `packages/server/` — proprietary mainline.
- `packages/website/` — proprietary product + marketing implementation.
- `packages/console/`
- `scripts/` (internal ops / release gates)
- Internal CTO specs, runbooks, pricing, progress reports under `docs/`
- Workflows: `ci.yml` (full monorepo), `release-gate-manual.yml`, etc.

## PR review

- Any PR that adds files **only** for the public mirror should touch
  `config/public-oss-manifest.json` and this document together.
- CODEOWNERS includes this path for review.
