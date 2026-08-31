import { THeaderStyleName } from './headerStyles';

/**
 * Which header a surface gets. Purely a renderer decision — nothing here
 * knows about styling, which lives in `headerStyles`.
 *
 * - `native` — the platform/stack draws the bar (the default).
 * - `custom` — an in-app `ScreenHeader`, styled by `headerStyles`.
 * - `none`   — no header at all.
 */
export type THeaderMode = 'native' | 'custom' | 'none';

/**
 * Which palette from `headerStyles` a header uses. `ScreenHeader` renders it
 * directly; native headers resolve it (defaulting from the presentation) in
 * `options.ts`.
 */
export type THeaderVariant = THeaderStyleName;
