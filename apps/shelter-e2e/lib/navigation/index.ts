/**
 * The header nav as one concern: the link set both bands carry, and the rules
 * that apply it.
 *
 *   - `constants.ts`  — the links: visible label + target
 *   - `elements.ts`   — how the header is addressed: `navLink`, `navToggle`,
 *                       `expectedHref`
 *   - `inline-nav.ts` — the `lg` and up band: `assertInlineNav`
 *   - `flyout-nav.ts` — below `lg`: `assertCollapsedNav`, `assertFlyoutNav`
 */
export * from './constants';
export * from './elements';
export * from './flyout-nav';
export * from './inline-nav';
