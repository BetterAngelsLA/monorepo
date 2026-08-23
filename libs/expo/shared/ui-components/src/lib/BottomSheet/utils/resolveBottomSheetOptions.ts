/**
 * resolveBottomSheetOptions
 *
 * Central configuration resolution layer for the BottomSheet system.
 *
 * After static merging, dynamic rules are applied
 * (e.g. resolving `showHandle` based on variant + snapPoints).
 *
 * This file is the single source of truth for option resolution.
 */

import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
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
 * - Otherwise returns a single flattened style object
 *
 * Flattened, not an array, and that matters: gorhom resolves the content
 * style with `StyleSheet.compose(...style)`, and `compose` accepts only TWO
 * arguments — so a three-layer array silently drops its third layer, which is
 * the caller's own overrides. Handing gorhom one object keeps every layer.
 *
 * This ensures consistent style resolution across:
 * - containerStyle
 * - sheetStyle
 * - contentStyle
 */
function mergeViewStyles(
  ...styles: Array<StyleProp<ViewStyle> | undefined>
): ViewStyle | undefined {
  const filtered = styles.filter(Boolean);

  if (filtered.length === 0) {
    return undefined;
  }

  return StyleSheet.flatten(filtered);
}

/**
 * Expands a `padding` shorthand into its four edges.
 *
 * Yoga resolves edge-specific properties over the shorthand regardless of the
 * order they were merged in, so a sheet passing `padding: 0` would silently
 * lose to a default's `paddingLeft`. Expanding each layer *before* merging
 * makes later layers win, which is what a style merge is expected to do.
 *
 * Edge values within the same layer still beat that layer's own shorthand,
 * matching Yoga.
 */
function expandPadding(style?: StyleProp<ViewStyle>): ViewStyle | undefined {
  const flattened = StyleSheet.flatten(style);

  if (!flattened || flattened.padding === undefined) {
    return flattened;
  }

  const { padding, ...rest } = flattened;

  return {
    paddingTop: padding,
    paddingRight: padding,
    paddingBottom: padding,
    paddingLeft: padding,
    ...rest,
  };
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
  options?: BottomSheetOptions,
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
      user.containerStyle,
    ),
    sheetStyle: mergeViewStyles(
      base.sheetStyle,
      variantOptions.sheetStyle,
      user.sheetStyle,
    ),
    contentStyle: mergeViewStyles(
      expandPadding(base.contentStyle),
      expandPadding(variantOptions.contentStyle),
      expandPadding(user.contentStyle),
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
