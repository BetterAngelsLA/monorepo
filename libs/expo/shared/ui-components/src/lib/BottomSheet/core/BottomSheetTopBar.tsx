/**
 * BottomSheetTopBar
 *
 * Unified top band for a bottom sheet: the centered handle indicator, optional
 * left/right slots (the right slot hosts the close button), and an optional
 * second-row header (e.g. a title).
 *
 * Designed to be mounted as Gorhom's `handleComponent`, so it:
 * - sits ABOVE the content container,
 * - has its measured height reserved automatically (content flows below it),
 * - inherits the handle's pan gesture.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────────┐
 *   │ [ left slot ]       ●        [ close btn ]│  row 1 (chrome)
 *   ├──────────────────────────────────────────┤
 *   │ title / header content                     │  row 2 (optional)
 *   └──────────────────────────────────────────┘
 *
 * Row 2 collapses entirely when `header` is omitted, so a bar with no header
 * stays a single band. When neither chrome nor header is present the whole bar
 * renders `null`, so Gorhom reserves no top space.
 *
 * Upstream:
 * - Rendered by `BottomSheetBase` via `handleComponent`
 */

import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BOTTOM_SHEET_PADDING } from '../constants';
import { BottomSheetCloseButton } from './BottomSheetCloseButton';

export interface BottomSheetTopBarProps {
  /**
   * Renders the centered handle indicator.
   */
  showHandle?: boolean;

  /**
   * When provided, renders the close button in the right slot.
   */
  onClose?: () => void;

  /**
   * Accessibility hint for the close button.
   */
  closeBtnAccessibilityHint?: string;

  /**
   * Optional left slot (e.g. a back button).
   */
  leftSlot?: ReactNode;

  /**
   * Optional second-row content (e.g. a title).
   * The row collapses entirely when omitted.
   */
  header?: ReactNode;

  /**
   * Gorhom's `handleStyle` — applied to the bar container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Gorhom's `handleIndicatorStyle` — applied to the handle indicator (pill).
   */
  handleIndicatorStyle?: StyleProp<ViewStyle>;

  /**
   * Style applied to the optional header row.
   */
  headerStyle?: StyleProp<ViewStyle>;

  testId?: string;
}

export function BottomSheetTopBar(props: BottomSheetTopBarProps) {
  const {
    showHandle = false,
    onClose,
    closeBtnAccessibilityHint = 'closes bottom sheet',
    leftSlot,
    header,
    style,
    handleIndicatorStyle,
    headerStyle,
    testId,
  } = props;

  const hasNav = showHandle || !!onClose || !!leftSlot;
  const hasHeader = !!header;

  /**
   * Nothing to show: render nothing so Gorhom measures zero top space.
   * (Any element here would be measured into `handleHeight`.)
   */
  if (!hasNav && !hasHeader) {
    return null;
  }

  return (
    <View testID={testId} style={style}>
      {hasNav && (
        <View style={styles.navRow}>
          <View style={[styles.slot, styles.slotLeft]}>{leftSlot}</View>

          <View style={styles.center}>
            {showHandle && (
              <View
                testID="bottom-sheet-handle"
                style={[styles.handleIndicator, handleIndicatorStyle]}
              />
            )}
          </View>

          <View style={[styles.slot, styles.slotRight]}>
            {!!onClose && (
              <BottomSheetCloseButton
                onClose={onClose}
                accessibilityHint={closeBtnAccessibilityHint}
              />
            )}
          </View>
        </View>
      )}

      {hasHeader && <View style={[styles.header, headerStyle]}>{header}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
  },
  slot: {
    flex: 1,
    justifyContent: 'center',
  },
  slotLeft: {
    alignItems: 'flex-start',
  },
  slotRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  handleIndicator: {
    width: 42,
    height: 5,
    borderRadius: Radiuses.xxs,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    marginVertical: Spacings.xs,
  },
  header: {
    paddingTop: Spacings.xxs,
    paddingBottom: Spacings.xs,
    paddingLeft: BOTTOM_SHEET_PADDING.paddingLeft,
    paddingRight: BOTTOM_SHEET_PADDING.paddingRight,
  },
});
