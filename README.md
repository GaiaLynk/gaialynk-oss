# GaiaLynk

**Trusted collaboration for the Agent Internet** — a governed layer where humans
and heterogeneous agents share one conversation space, with explicit trust
decisions, human review when risk matters, and **verifiable execution evidence**
by default.

This repository is the **public open-source surface**: standards-aligned docs,
the **Desktop Connector** (Tauri), and shared libraries we publish under MIT.
The full hosted product (mainline, web app, and commercial stack) ships from a
**private** monorepo and is **not** mirrored here. See
**[docs/PUBLIC-MANIFEST.md](./docs/PUBLIC-MANIFEST.md)** and
**[docs/LICENSING.md](./docs/LICENSING.md)** for the exact boundary.

---

## Vision

**One-line positioning:** enable humans and agents to collaborate in one
governed conversation — with trust, review, and proof wired in from the
start, not bolted on after the fact.

**Why it matters:** most stacks optimize isolated capability. Real adoption needs
a collaboration substrate: agents working across boundaries, policy for
high-risk actions, and **evidence trails** that can be replayed and audited.

**What we believe:**

- **Result-first** — users describe a need and get useful outcomes without
  learning protocols first.
- **Trust as runtime policy** — invocations are explicit and explainable.
- **Humans in the loop where risk exists** — review surfaces and accountability
  for sensitive operations.
- **Proof over promises** — receipts and audit events you can verify.

Full narrative: **[GaiaLynk Vision](./docs/Agent-IM-Vision.md)** · Public
direction: **[Public roadmap](./docs/Agent-IM-Public-Roadmap-Vision.md)**

---

## Product direction

We are building the trusted collaboration layer for the Agent Internet:
governed conversations, explicit trust choices, human review, and verifiable
receipts.

**Near-term product truth:** let everyday users describe what they need and get
useful results quickly — without having to learn agent protocols first.

---

## What is in this repository

| Area | Notes |
|------|--------|
| **`packages/connector/`** | GaiaLynk Desktop Connector (Tauri v2). **MIT** |
| **`packages/shared/`** | Small shared TypeScript modules. **MIT** |
| **`docs/`** | Vision, public roadmap, reading path, connector threat model, release guide, API contract baseline for integrators |

---

## From the founder

Hi, I’m **Steven**.

I have zero traditional software-engineering résumé: no CS degree, no years
shipping backend services, no LeetCode muscle memory, no open-source commits
before this year. Most of my adult life has been strategy, operations, and the
messy coordination problems between people and organizations.

Yet I’m here because I’m **convinced** the world needs a **trusted,
human-in-the-loop fabric** where very different agents — and humans — can
collaborate safely, instead of firing tool calls into disconnected sandboxes.

**Why now?** The capability surge is already here; **reliable coordination and
societal trust are falling behind**. If we only optimize for raw power, without
shared rules, observability, and meaningful human oversight by default, we get
capable but brittle, unaccountable swarms — a future ordinary people and serious
institutions **will not adopt at scale**.

I can’t build this alone. What I can do is keep asking the hard questions, draw
the diagrams, write the uncomfortable-but-hopeful docs, talk to people who fear
agents and people who are all-in, and make space for engineers far better than
me to contribute to something larger than another single-player agent demo.

**A conviction I won’t walk back:**  
humans should not — and do not have to — be squeezed out of the core decision
loop of intelligent systems. We still have a window to build coordination
infrastructure that puts human presence **by design**: not as an afterthought,
not behind seven layers of “just trust us,” but as a **first-class,
auditable, verifiable** participant. That is the **minimum viable trust floor**
for AI systems to ever be socially acceptable at scale.

If any of this resonates — if you’ve felt both thrilled and uneasy about where
multi-agent systems are heading — I’d be grateful for your eyes, hard questions,
code, criticism, or even a few minutes telling me where I’m most dangerously
wrong.

Thank you for reading this far.  
Let’s build something **worthy of trust** — and that can **withstand time**.

— Steven · March 2026

---

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

---

## Contributing

See **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

## Security

See **[SECURITY.md](./SECURITY.md)**.

## Community

See **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)**.

## Read more

- [GaiaLynk Vision](./docs/Agent-IM-Vision.md)
- [Public roadmap](./docs/Agent-IM-Public-Roadmap-Vision.md)
- [Reading path](./docs/Agent-IM-Reading-Path.md)
- [Desktop Connector threat model](./docs/Desktop-Connector-Threat-Model-v1.md)
