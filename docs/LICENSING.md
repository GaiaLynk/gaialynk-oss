# Licensing — GaiaLynk monorepo

This document is the **human-readable source of truth** for how licensing works
in this repository. It supports the strategy: **open standards + minimal trusted
loop + Connector** in public, **scale + commercial stack** private.

> **Not legal advice.** Have counsel review before a major release or license change.

## Summary

| Area | License | Notes |
|------|---------|--------|
| `packages/connector/` | [MIT](../packages/connector/LICENSE) | Intended for public OSS mirror; permissive for ecosystem adoption. |
| `packages/shared/` | [MIT](../packages/shared/LICENSE) | Small shared types/constants shipped with OSS surface. |
| Selected docs + contracts | MIT (same as root [LICENSE](../LICENSE)) | Only paths listed in [PUBLIC-MANIFEST.md](./PUBLIC-MANIFEST.md) / `config/public-oss-manifest.json`. |
| `packages/server/` | **Proprietary** — [LICENSE](../packages/server/LICENSE) | Mainline / scale / commercial logic; not published to the public OSS mirror. |
| `packages/website/` | **Proprietary** — [LICENSE](../packages/website/LICENSE) | Full product web app + BFF; not published to the public OSS mirror. |
| `packages/console/` | **Proprietary** — [LICENSE](../packages/console/LICENSE) | Internal / demo console. |
| Root `LICENSE` | MIT text | Applies **only** to OSS-designated paths above, not the entire tree. See [NOTICE](../NOTICE). |

## Public OSS mirror

The public GitHub repository (e.g. `gaialynk-oss`) should contain **only** paths
from `config/public-oss-manifest.json`. Maintainers sync **from this private
monorepo** (the script is not published in the public clone):

```bash
export PUBLIC_OSS_MIRROR_DIR=/path/to/oss-repo-clone
node scripts/sync-public-oss-mirror.mjs
```

Then review, commit, and push from that clone.

## Changing boundaries

1. Update `config/public-oss-manifest.json` and [PUBLIC-MANIFEST.md](./PUBLIC-MANIFEST.md).
2. Update this file if licenses change.
3. Run sync and verify the public repo builds (CI).
4. Involve legal for anything that moves from proprietary → MIT or vice versa.
