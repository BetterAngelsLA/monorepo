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
 * Leading inset for a header's left slot.
 *
 * react-navigation's JS (web) header lays `headerLeft` flush against the screen
 * edge; the native bars inset it (react-navigation's own back chevron carries an
 * ~11pt leading margin). Without this the "Back" label touches the left edge of
 * the window on web only, which reads as misaligned next to the centred title.
 *
 * Applied by wrapping the slot in a View rather than through a
 * `headerLeftContainerStyle` screen option. That option is declared by the JS
 * stack, not by native-stack — the stack this app uses — so passing it is a type
 * error, and that is the reason it is not used here. Worth knowing: the web
 * runtime *would* honour it, because the vendored native-stack spreads unknown
 * options into `elements.Header`, which reads exactly these two keys (measured —
 * the slot's padding moves to 12px and the button inset follows, with no wrapper
 * element). A wrapper does not depend on that forwarding, which is why it stays.
 *
 * Web-only: the native bars already inset themselves.
 */
export const headerLeftInsetStyle =
  Platform.OS === 'web' ? { paddingStart: HEADER_SLOT_INSET } : undefined;

/**
 * Trailing inset for a header's right slot — the mirror of
 * {@link headerLeftInsetStyle}, and needed for the same reason: the JS (web)
 * header lays `headerRight` flush against the screen edge.
 *
 * Measured on `/profile` before this existed: the "Edit" button's right edge sat
 * at the window edge (inset 0) while the "Back" button was already inset 12, so
 * the two slots disagreed by exactly this much.
 *
 * Every right slot needs it — the "Edit" buttons, the client screen's overflow
 * menu, and the modal close button — so apply it to the slot's content rather
 * than to one kind of button.
 */
export const headerRightInsetStyle =
  Platform.OS === 'web' ? { paddingEnd: HEADER_SLOT_INSET } : undefined;
