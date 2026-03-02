/**
 * resolveBottomSheetOptions
 *
 * Central configuration resolution layer for the BottomSheet system.
 *
 * Responsibilities:
 * - Merge global defaults
 * - Apply variant-level overrides
 * - Apply user-provided overrides
 * - Resolve dynamic behavior (e.g. handle visibility)
 * - Normalize style merging
 *
 * Resolution order (lowest → highest precedence):
 *
 *   DEFAULT_BOTTOM_SHEET_OPTIONS
 *       → BOTTOM_SHEET_VARIANT_OPTIONS[variant]
 *           → user-provided options
 *
 * After static merging, dynamic rules are applied
 * (e.g. resolving `showHandle` based on variant + snapPoints).
 *
 * This file is the single source of truth for option resolution.
 *
 * It does NOT:
 * - Render anything
 * - Control lifecycle
 * - Interact with Gorhom directly
 *
 * Those responsibilities belong to:
 *   - BottomSheetBase (rendering)
 *   - BottomSheetModalProvider (lifecycle/stacking)
 */

import { StyleProp, ViewStyle } from 'react-native';
import {
  BOTTOM_SHEET_VARIANT_OPTIONS,
  DEFAULT_BOTTOM_SHEET_OPTIONS,
} from '../constants';
import { BottomSheetOptions, BottomSheetVariant } from '../types';
import { resolveShowHandle } from './resolveShowHandle';

/**
 * Utility helper to merge React Native style props.
 *
 * Accepts any number of style objects and:
 * - Filters out undefined values
 * - Returns undefined if no styles remain
 * - Otherwise returns a merged array-style prop
 *
 * This ensures consistent style resolution across:
 * - containerStyle
 * - sheetStyle
 * - contentStyle
 */
function mergeViewStyles(
  ...styles: Array<StyleProp<ViewStyle> | undefined>
): StyleProp<ViewStyle> | undefined {
  const filtered = styles.filter(Boolean);

  if (filtered.length === 0) {
    return undefined;
  }

  return filtered as StyleProp<ViewStyle>;
}

/**
 * Resolves a complete BottomSheetOptions object.
 *
 * Steps:
 * 1. Determine variant (default if unspecified)
 * 2. Merge base + variant + user options
 * 3. Normalize style props (container/sheet/content)
 * 4. Apply dynamic option resolution (e.g. showHandle)
 *
 * @param options Optional user-provided configuration
 * @returns Fully resolved BottomSheetOptions object
 */

export function resolveBottomSheetOptions(
  options?: BottomSheetOptions
): BottomSheetOptions {
  const user = options ?? {};
  const variant: BottomSheetVariant = user.variant ?? 'default';

  const base = DEFAULT_BOTTOM_SHEET_OPTIONS;
  const variantOptions = BOTTOM_SHEET_VARIANT_OPTIONS[variant] ?? {};

  // Merge: User options win
  const merged: BottomSheetOptions = {
    ...base,
    ...variantOptions,
    ...user,

    containerStyle: mergeViewStyles(
      base.containerStyle,
      variantOptions.containerStyle,
      user.containerStyle
    ),
    sheetStyle: mergeViewStyles(
      base.sheetStyle,
      variantOptions.sheetStyle,
      user.sheetStyle
    ),
    contentStyle: mergeViewStyles(
      base.contentStyle,
      variantOptions.contentStyle,
      user.contentStyle
    ),
  };

  // Resolve handle visibility
  const resolvedShowHandle = resolveShowHandle({
    userValue: user.showHandle,
    variant,
    snapPoints: merged.snapPoints,
  });

  return {
    ...merged,
    showHandle: resolvedShowHandle,
  };
}
