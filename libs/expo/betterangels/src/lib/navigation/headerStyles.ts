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
 */
const HEADER_SLOT_INSET = 12;

/**
 * Leading inset for a header's left slot. Web-only: the JS (web) header lays
 * `headerLeft` flush against the screen edge while the native bars inset it, so
 * without this the "Back" label touches the window edge on web only.
 *
 * Applied by wrapping the slot in a View: `headerLeftContainerStyle` is declared
 * by the JS stack rather than native-stack, so passing it is a type error, and a
 * wrapper does not rely on the vendored fork forwarding undeclared options.
 */
export const headerLeftInsetStyle =
  Platform.OS === 'web' ? { paddingStart: HEADER_SLOT_INSET } : undefined;

/**
 * Trailing mirror of {@link headerLeftInsetStyle}. Every right slot needs it (the
 * "Edit" buttons, the client screen's overflow menu, the modal close button), so
 * apply it to the slot's content rather than to one kind of button.
 */
export const headerRightInsetStyle =
  Platform.OS === 'web' ? { paddingEnd: HEADER_SLOT_INSET } : undefined;
