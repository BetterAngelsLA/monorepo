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
 * Leading inset for a header's left slot.
 *
 * react-navigation's JS (web) header lays `headerLeft` flush against the screen
 * edge; the native bars inset it (react-navigation's own back chevron carries an
 * ~11pt leading margin). Without this the "Back" label touches the left edge of
 * the window on web only, which reads as misaligned next to the centred title.
 *
 * Applied by the button components rather than through a
 * `headerLeftContainerStyle` screen option: that option belongs to the JS stack
 * and is not part of native-stack's options, which is the stack this app uses
 * (so it would be a type error and silently ignored on device).
 *
 * Web-only: the native bars already inset themselves.
 */
export const headerLeftInsetStyle =
  Platform.OS === 'web' ? { paddingStart: 12 } : undefined;
