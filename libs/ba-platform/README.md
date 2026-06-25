# ba-platform

The **platform layer** for BetterAngels frontend applications — shared code that connects our frontend apps to the BetterAngels backend.

## Why this exists

BetterAngels has multiple frontend apps (shelter-operator, betterangels-admin, mobile) that share the same backend. Each app needs the same backend-specific behavior: sending the `X-Organization-ID` header, managing the active organization, and so on.

This code doesn't belong in the generic shared libraries (like `libs/react/shared` or `libs/apollo`) because those are designed to be backend-agnostic and reusable across projects. `ba-platform` is the dedicated home for that glue.

## Layout — symmetric with `libs/`

`ba-platform` mirrors the top-level `libs/` structure. Anything that is shared across BA apps but is **not** generic enough for the main `libs/` goes here, organized by framework/layer:

```
libs/ba-platform/src/lib/
├── react/          ← BA-specific React code (hooks, providers, Apollo links)
│   ├── apollo/
│   └── providers/
├── ts/             ← BA-specific pure TypeScript (constants, types, utilities)
│   └── (future)
└── index.ts
```

The rule: if you'd put a **generic** version of this code in `libs/react/` or `libs/ts/`, the **BA-specific** version goes under the corresponding subdirectory here.

## What belongs here

| ✅ Belongs here | ❌ Does NOT belong here |
|---|---|
| Code that **depends on BA backend conventions** (e.g., `X-Organization-ID` header, `HasOrgPerm`, org-scoped queries, BA-specific storage keys) | Generic React hooks or utilities (→ `libs/react/shared`) |
| Code shared by **two or more BA frontend apps** | App-specific components or pages (→ the app's own lib, e.g. `libs/react/shelter-operator`) |
| BA-specific integration code for any framework (React, pure TS, etc.) | Generic Apollo or storage utilities with no BA dependency (→ `libs/apollo`, `libs/react/shared`) |

## What's here now

| Module | Framework | Purpose |
|--------|-----------|---------|
| `react/apollo/orgLink` | React / Apollo | Apollo Link that reads the active org ID from storage and injects the `X-Organization-ID` header on every GraphQL request |
| `react/providers/activeOrg/useActiveOrgState` | React | Shared hook that manages active organization selection, storage persistence, and permission checks. Each app wraps the returned state in its own context. |

## Conventions

- **Symmetric layout**: Mirror `libs/` structure. React code goes under `react/`, pure TypeScript under `ts/`, etc.
- **Single source of truth**: If two BA apps need the same BA-specific behavior, it goes here. App libs re-export from here rather than duplicating.
- **Top-level import**: `@monorepo/ba-platform` — everything re-exports from the package root. Framework-specific entry points (e.g. `@monorepo/ba-platform/react`) can be added later if tree-shaking becomes a concern.
