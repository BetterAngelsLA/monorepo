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
 * Global defaults applied to every sheet before variant + user overrides.
 *
 * These represent design-system baseline behavior.
 */
export const DEFAULT_BOTTOM_SHEET_OPTIONS: Partial<BottomSheetOptions> = {
  /**
   * Allow sheet height to adapt to content.
   */
  enableDynamicSizing: true,

  /**
   * Allow swipe-down to dismiss by default.
   */
  enablePanDownToClose: true,

  /**
   * Content is non-scrollable unless explicitly requested.
   */
  scrollable: false,

  /**
   * Close button is opt-in.
   */
  showCloseButton: false,

  /**
   * Backdrop is enabled with semi-transparent overlay.
   */
  disableBackdrop: false,
  backdropOpacity: 0.5,

  /**
   * Default stacking behavior replaces existing sheets.
   */
  stackBehavior: 'replace',
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
      padding: 0,
    },
  },
};
