# Contributing to GaiaLynk (open repository)

Thanks for helping improve the **open-source surface**: Connector, shared modules,
and public docs.

## Principles

- **No secrets** — Never commit `.env`, keys, tokens, or production URLs with credentials.
- **Stay in scope** — This repo is intentionally small. Large product changes land
  in the private monorepo; here we focus on Connector, `packages/shared`, and
  whitelisted `docs/`.
- **Match the manifest** — If you add a new public doc or path, update
  `docs/PUBLIC-MANIFEST.md` and `config/public-oss-manifest.json` in the **source**
  monorepo (maintainers sync to this repo).

## Development

```bash
cd packages/connector
npm install
npm run tauri:dev
```

TypeScript check:

```bash
npx tsc --noEmit -p packages/connector/tsconfig.json
```

Rust tests:

```bash
cd packages/connector/src-tauri && cargo test
```

## Pull requests

- One clear objective per PR.
- Describe what changed and how you tested it (OS, Connector version).
- Follow conventional commits when possible: `feat(connector): …`, `fix(connector): …`, `docs: …`.

## Reporting issues

Include steps to reproduce, expected vs actual behavior, and OS / architecture.
