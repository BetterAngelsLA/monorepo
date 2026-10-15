/**
 * Entry point for reusable test code — what specs import instead of restating.
 * Never collected: `testDir` scopes the runner to `tests/`, and `testMatch` to
 * `*.spec.ts`.
 *
 * Mirrors `.maestro/lib/` in the mobile suite: concern folders, each with its
 * own `index.ts`, no specs.
 *
 *   - `framework/` — `VIEWPORTS`, the viewport values specs pin per band
 *   - `navigation/` — the header rule: `NAV_LINKS` (label + target) and the
 *     assertions that apply it, `assertInlineNav`, `assertCollapsedNav` and
 *     `assertFlyoutNav`, with `navLink` to address one link by its label
 */
export * from './framework';
export * from './navigation';
