# React / Frontend Styleguide

## Component Conventions

- **No `export default`** — always use named exports. The only exceptions are routing-related files that require it.
  - Component logic goes in named files (e.g., `TeamsPage.tsx`).
  - Index files (`index.ts`) should only re-export: `export { TeamsPage } from './TeamsPage'`.
  - Never put component logic directly in an index file.
- **Every lib component should accept `className`** — with few exceptions, such as very local/non-shared components.
- **Use `mergeCss` not `clsx`** — `mergeCss` from `@monorepo/react/shared` combines `clsx` + `twMerge`.

## State & Data

- **Prefer custom hooks** for data fetching (e.g., `useOrgTeams`) over raw `useQuery` calls in components.
  - Hooks should handle loading and empty states. Return errors to the consumer — the caller decides how to display them. (Exception: local, non-exported hooks that abstract UI logic.)
  - **Co-locate the `.graphql` file with the hook** — the query document and its `__generated__/` output should live in the same directory as the hook (e.g., `hooks/useOrgTeams/teams.graphql`). Consumers import the hook, never the GQL document directly.

- **Handle loading, error, and empty states** explicitly.
- **Use `useActiveOrg`** for org-scoped state; never read from localStorage directly.

## Error Handling

- **Never trust backend error messages** to display to users. Log the actual error, show a generic user-friendly message unless the error matches a known, expected key.
  - `console.error(err)` then show a generic message like `"Sorry, something went wrong. Please try again."`
- Use `toError()` from `@monorepo/react/shared` for error normalization (in non-user-facing contexts).

## Code Style

- **Avoid ternary operators unless very basic.** Use early returns instead.
  - "Very basic" means both branches are simple literals or single short identifiers — readable in one glance.
  - As soon as either branch contains a function call, template literal with expressions, or any non-trivial computation, use `if/else`.
  - In TSX, use guards for conditional rendering or separate components if it gets complicated.
  - Example of an acceptable ternary: `const color = isError ? 'red' : 'gray';`
- **Avoid type casting** (`as`) when possible — make function signatures accept the correct types.
  - If a callback receives `string | null`, the handler should accept `string | null` — don't cast at the call site.
  - Use `??` (nullish coalescing) instead of `||` for defaults where `0` or `''` are valid values.
- **Use `Partial<Record<>>`** for label/display mappings rather than full records with optional keys.

## GraphQL

- **Paginated queries must pass a `limit`** — defaults are small. For dropdowns/selects that need all results, pass a high limit (e.g., `10000`).
- **Use `useInfiniteScrollQuery` for list/feed UX** — from `@monorepo/apollo`, handles offset pagination with `loadMore`/`reload`/`hasMore`. For simple selects and dropdowns, a flat query with a high `limit` is sufficient.
- Use generated GraphQL types from codegen (never hand-write types).

## Imports

- **Top-level imports only** — no inline/dynamic `import()` inside functions unless truly necessary.
- Group imports: third-party → monorepo libs → relative/local.
