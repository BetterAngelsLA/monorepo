import { Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ViewStyle } from 'react-native';
import { BottomSheetOptions, BottomSheetVariant } from './types';

// Default style definitions
export const BOTTOM_SHEET_RADIUS = Radiuses.md;

export const BOTTOM_SHEET_PADDING: Pick<
  ViewStyle,
  'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight'
> = {
  paddingTop: Spacings.sm,
  paddingLeft: Spacings.sm,
  paddingRight: Spacings.sm,
  paddingBottom: Spacings.md,
};

/**
 * Authoritative option defaults applied to every sheet before variant + user
 * overrides.
 *
 * Single source of truth for default *behavior* and options consumed upstream
 * of rendering. Baseline surface styling is intentionally NOT here — it lives
 * in `BottomSheetBase`'s `styles` so the component's look stays co-located
 * with the component. `BOTTOM_SHEET_VARIANT_OPTIONS` only deviates from the
 * baseline, and user options override everything last.
 *
 * Keep defaults here; do not hard-code them in the provider or the resolution
 * utilities.
 */
export const DEFAULT_BOTTOM_SHEET_OPTIONS: Partial<BottomSheetOptions> = {
  // Allow sheet height to adapt to content.
  enableDynamicSizing: true,

  // Allow swipe-down to dismiss by default.
  enablePanDownToClose: true,

  // Content is non-scrollable unless explicitly requested.
  scrollable: false,

  // Close button is opt-in.
  showCloseButton: false,

  // Backdrop is enabled with semi-transparent overlay.
  disableBackdrop: false,

  backdropOpacity: 0.5,

  // Opening a new sheet dismisses all existing ones.
  stackBehavior: 'replace',

  // Non-accessible by default: iOS e2e (maestro) and screen-readers collapse
  // accessible parents, swallowing the sheet's children. DEV-2513.
  accessible: false,
};

/**
 * Variant-specific visual overrides.
 *
 * Variants define structural UX modes.
 * Dynamic behavior (like showHandle resolution)
 * is handled in resolveBottomSheetOptions.
 */
export const BOTTOM_SHEET_VARIANT_OPTIONS: Record<
  BottomSheetVariant,
  Partial<BottomSheetOptions>
> = {
  /**
   * Default sheet behavior.
   * Visual styling inherits base design.
   */
  default: {},

  /**
   * Bare sheet:
   * - No radius
   * - Transparent background
   * - No padding
   *
   * Intended for fully custom content.
   */
  bare: {
    sheetStyle: {
      backgroundColor: 'transparent',
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    contentStyle: {
      paddingTop: 0,
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: 0,
    },
  },
};
