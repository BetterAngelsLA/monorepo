import { Colors } from '@monorepo/expo/shared/static';
import { Platform } from 'react-native';

/**
 * Header palettes — the single source of truth for header colours. Both header
 * renderers read it: the native resolvers in `options.ts` project it onto the
 * options react-navigation expects, the in-app `ScreenHeader` renders it.
 *
 * `pressedBackgroundColor` is the fill a button on that bar gets while
 * pressed — a surface-dependent colour, so it lives with the palette (a
 * light header would press dark, a dark header presses light).
 *
 * Keys are palette roles, not surfaces: a modal may opt into `primary`, a
 * pushed screen into `secondary`, with no naming friction. Which palette a
 * surface gets by default is a separate decision in `options.ts`.
 */
export const headerStyles = {
  primary: {
    backgroundColor: Colors.BRAND_DARK_BLUE,
    textColor: Colors.WHITE,
    pressedBackgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondary: {
    backgroundColor: Colors.BRAND_STEEL_BLUE,
    textColor: Colors.WHITE,
    pressedBackgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
} as const;

export type THeaderStyleName = keyof typeof headerStyles;

/**
 * How far a header slot's content sits from the window edge on web. Matches the
 * ~11–12pt leading margin react-navigation's own back chevron carries on native.
 *
 * Web-only, and consumed by `HeaderSlot`, which owns the wrapper and the reason.
 */
const HEADER_SLOT_INSET = 12;

/** Leading inset for a header's left slot. See `HeaderSlot`. */
export const headerLeftInsetStyle =
  Platform.OS === 'web' ? { paddingStart: HEADER_SLOT_INSET } : undefined;

/** Trailing mirror of {@link headerLeftInsetStyle}. See `HeaderSlot`. */
export const headerRightInsetStyle =
  Platform.OS === 'web' ? { paddingEnd: HEADER_SLOT_INSET } : undefined;
