# GaiaLynk (open source)

Trusted collaboration layer for the Agent Internet — **open standards, desktop
Connector, and public documentation** live here.

The full product (hosted mainline, web app, and commercial stack) is developed
in a private monorepo and is **not** published in this repository.

## What is in this repo

- **`packages/connector/`** — GaiaLynk Desktop Connector (Tauri). MIT License.
- **`packages/shared/`** — Small shared TypeScript modules. MIT License.
- **`docs/`** — Vision, public roadmap, reading path, connector threat model,
  release guide, and API contract baseline for integrators.

See **[docs/PUBLIC-MANIFEST.md](./docs/PUBLIC-MANIFEST.md)** and
**[docs/LICENSING.md](./docs/LICENSING.md)** for the exact boundary.

## Quick start (Connector)

```bash
cd packages/connector
npm install
npm run tauri:dev
```

Build (local):

```bash
npm run build --prefix packages/connector
```

Rust tests:

```bash
cd packages/connector/src-tauri && cargo test
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

See [SECURITY.md](./SECURITY.md).

## Community

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Read more

- [GaiaLynk Vision](./docs/Agent-IM-Vision.md)
- [Public roadmap](./docs/Agent-IM-Public-Roadmap-Vision.md)
