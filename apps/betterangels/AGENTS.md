# AGENTS — betterangels (Expo / React Native)

Mobile app. Canonical rules: `docs/ai-instructions.md` and
[`docs/styleguides/react.md`](../../docs/styleguides/react.md). Routes live in
`src/app/` (expo-router); global state in `src/providers/` (Jotai).

## Commands (run from the workspace root)

| Task | Command |
| --- | --- |
| Start | `ynx-start-fe` (`expo start`, port 8081) |
| Tests | `yarn nx test betterangels` (vitest + vitest-native, globals on, `src/**/*.{test,spec}.{ts,tsx}`) |
| Lint / typecheck | `ynx-lint-fe` · `ynx-typecheck` |
| E2E | `yarn nx e2e betterangels -c ios\|android` (Maestro flows in `.maestro/`) |

## Conventions (on top of the React styleguide)

- Named exports only; `index.ts` re-exports; no component logic in index files.
- Data hooks colocate their `.graphql` document + generated types
  (`hooks/useX/x.graphql`); consumers import the hook, never the GQL document.
- Org-scoped state via `useActiveOrg` — never read localStorage directly.
- Paginated GraphQL queries must pass `limit`; infinite lists use
  `useInfiniteScrollQuery` from `@monorepo/apollo`.
- `mergeCss` (not `clsx`); `toError()` from `@monorepo/react/shared`.
- Shared `Button` requires a `variant` prop.

## Uploads (DEV-2199 pattern)

- Picking files starts uploads immediately (`useDocsUpload.startSession`); upload modals
  are pure pickers that close immediately — no confirmation step.
- Progress is a context-free Jotai store (`providers/uploadProgress/uploadProgressAtoms.ts`,
  actions via `getDefaultStore()`). `UploadProgressBar` strips mount directly beneath each
  screen header; `UploadStage` is a resume-only detail view (per-file cancel/retry,
  no global footer).

## Test gotchas

- Importing `providers/index.ts` in a spec drags in expo-router/expo-crypto →
  `requireNativeModule is not a function`. Mock `expo-crypto` or import
  `providers/uploadProgress` directly.
- `react-native-a11y/has-accessibility-hint`: `accessibilityLabel` needs an
  `accessibilityHint`; component mocks in specs must forward it.
