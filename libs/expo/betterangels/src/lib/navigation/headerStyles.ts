import { Colors } from '@monorepo/expo/shared/static';

/**
 * Header palettes — the single source of truth for header colours. Both header
 * renderers read it: the native resolvers in `options.ts` project it onto the
 * options react-navigation expects, the in-app `ScreenHeader` renders it.
 *
 * Keys are palette roles, not surfaces: a modal may opt into `primary`, a
 * pushed screen into `secondary`, with no naming friction. Which palette a
 * surface gets by default is a separate decision in `options.ts`.
 */
export const headerStyles = {
  primary: {
    backgroundColor: Colors.BRAND_DARK_BLUE,
    textColor: Colors.WHITE,
  },
  secondary: {
    backgroundColor: Colors.BRAND_STEEL_BLUE,
    textColor: Colors.WHITE,
  },
} as const;

export type THeaderStyleName = keyof typeof headerStyles;
