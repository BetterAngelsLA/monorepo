/**
 * Shared color classes for date-range-filter components.
 *
 * These are complete Tailwind class strings rather than bare hex values.
 * Tailwind scans source as plain text, so a class assembled at runtime like
 * `text-[${HEX}]` is never detected and the CSS is never generated. Any new
 * entry must likewise be a full class, variants included.
 */

/** Default body / label text */
export const TEXT_PRIMARY = 'text-[#383B40]';

/** Muted text – weekday headers, secondary labels, nav icons */
export const TEXT_SECONDARY = 'text-[#747A82]';

/** Disabled / outside-month text */
export const TEXT_DISABLED = 'text-[#A8AEB8]';

/** Subtle hover background for interactive elements */
export const HOVER_BG = 'hover:bg-[#F4F6FD]';

/** Light blue highlight behind a selected range */
export const RANGE_BG = 'bg-[#DCF1FF]';

/** Primary accent blue fill on a selected day button */
export const DAY_SELECTED_BG = '[&>button]:bg-[#008CEE]';

/** Darker primary blue – hover on a selected day button */
export const DAY_SELECTED_HOVER_BG = '[&>button]:hover:bg-[#0071C0]';

/** Primary accent blue ring marking today */
export const DAY_TODAY_RING = '[&>button]:ring-[#008CEE]';
