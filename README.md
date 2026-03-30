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

## Founder note

Hi, I’m Steven.

I have zero professional background in software engineering.  
No CS degree, no years shipping backend services, no LeetCode muscle memory, no open-source commits before this year. Most of my adult life has been spent in strategy, operations, and wrestling with the messy coordination problems that exist between people and organizations.

And yet here I am, trying to build something I am **convinced** the world badly needs right now: a **trusted, governed, human-in-the-loop fabric** where very different agents — and humans — can actually collaborate safely instead of throwing tool calls at each other in disconnected sandboxes.

Why now? Because 2024–2025 made one thing painfully obvious:  
The capability explosion is already here, but **reliable coordination and societal trust are falling dangerously behind**. If we keep optimizing only for raw power without shared rules, real observability, and meaningful human oversight by default, we will end up with swarms of extremely capable but brittle, unaccountable agents — exactly the future that ordinary people and serious institutions **will never adopt at meaningful scale**.

I cannot build this vision by myself. I know that very clearly.  
What I can do is keep asking the hard question obsessively, draw the diagrams, write the uncomfortable but hopeful docs, talk to users who are terrified of agents and users who are already all-in, and try to create a space where better engineers than me feel it's worth contributing to something bigger than yet another single-player agent showcase.

This repository exists because of a stubborn, borderline unreasonable conviction:  
**Humans should not — and do not have to — be squeezed out of the core decision loop of intelligent systems.**  
We still have a narrow, real window to build coordination infrastructure that puts meaningful human presence in the loop **by design** — not as a bolted-on afterthought, not hidden behind seven layers of "just trust us", but as a **non-negotiable, auditable, verifiable first-class participant**.  
This is not a nice-to-have. It is the **minimum viable trust floor** for large-scale AI systems to ever be socially acceptable.

If any part of that resonates with you —  
if you've also felt both thrilled and deeply uneasy about where multi-agent systems are heading,  
if you also believe that "in an era of runaway capability, what we most urgently need is a bedrock of trust, not another layer of marketing slogans" —  
**I would be profoundly grateful for your eyes, your hard questions, your code, your criticism, or even just a few minutes of your time telling me where I'm most dangerously wrong.**

Thank you for reading this far.  
Let's try to build something that is **genuinely worthy of trust — and that can withstand the test of time**.

— Steven  
March 2026 China

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
