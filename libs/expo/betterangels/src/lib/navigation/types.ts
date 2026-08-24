/**
 * What a header looks like. Purely about the header — nothing here knows about
 * navigation, presentations, or who is rendering it.
 *
 * - `default` — a screen's bar: Back on the left.
 * - `modal`   — a modal surface's bar: close button on the right.
 * - `minimal` — background only, collapsed to the device's top inset. For
 *               surfaces that own their whole layout but still need the status
 *               bar to sit on something.
 * - `none`    — no header at all.
 */
export type THeaderVariant = 'default' | 'modal' | 'minimal' | 'none';
