/**
 * Which header a surface gets. Purely a renderer decision — nothing here
 * knows about styling, which lives in `headerVariants`.
 *
 * - `native`  — the platform/stack draws the bar (the default).
 * - `custom`  — an in-app `ScreenHeader`, styled by `headerVariants`.
 * - `none`    — no header at all.
 */
export type THeaderMode = 'native' | 'custom' | 'none';

/**
 * What a header looks like — a pure style, defined once in `headerVariants`.
 * Native headers project the same config through `getNativeHeaderOptions`;
 * custom headers render it in-app via `ScreenHeader`.
 *
 * - `screen`  — a screen's bar: Back on the left.
 * - `modal`   — a modal surface's bar: close button on the right.
 * - `minimal` — background only, collapsed to the device's top inset. For
 *               surfaces that own their whole layout but still need the status
 *               bar to sit on something.
 */
export type THeaderVariant = 'screen' | 'modal' | 'minimal';
