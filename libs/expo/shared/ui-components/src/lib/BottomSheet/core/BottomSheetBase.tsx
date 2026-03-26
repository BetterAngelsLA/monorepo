/**
 * BottomSheetBase
 *
 * Pure presentation layer for BottomSheet rendering.
 *
 * Responsibilities:
 * - Receives fully resolved `BottomSheetOptions`
 * - Maps options → Gorhom props
 * - Renders:
 *     - backdrop
 *     - handle
 *     - header
 *     - content container
 *
 * This component does NOT:
 * - manage state
 * - resolve options
 * - control stacking or lifecycle
 *
 * Upstream:
 * - API + usage: `useBottomSheet`
 * - Lifecycle + stacking: `BottomSheetModalProvider`
 * - Option resolution: `resolveBottomSheetOptions`
 */

import {
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetModal as GbsBottomSheetModal,
  BottomSheetModalProps as GbsBottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { forwardRef, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { BOTTOM_SHEET_PADDING, BOTTOM_SHEET_RADIUS } from '../constants';
import { BottomSheetOptions } from '../types';
import { BottomSheetBackdrop } from './BottomSheetBackdrop';
import { BottomSheetHeader } from './BottomSheetHeader';

type BottomSheetModalOwnProps = {
  /**
   * Sheet body content.
   */
  children: ReactNode;

  /**
   * Called when the sheet should close via header button.
   * Lifecycle dismissal is handled upstream by Provider.
   */
  onRequestClose?: () => void;

  /**
   * Fully resolved configuration object.
   * Must already include defaults + variant resolution.
   */
  options: BottomSheetOptions;
};

type TBottomSheetModal = GbsBottomSheetModalProps & BottomSheetModalOwnProps;

const BottomSheetBase = forwardRef<GbsBottomSheetModal, TBottomSheetModal>(
  function BottomSheetModal(props, ref) {
    const { children, onRequestClose, options, ...gorhomProps } = props;

    /**
     * Destructure resolved options.
     * No additional logic should be added here —
     * this component respects the resolved configuration.
     */
    const {
      // Gorhom-related
      enablePanDownToClose,
      enableDynamicSizing,
      snapPoints,
      containerComponent,

      // Wrapper-level
      disableBackdrop,
      backdropOpacity,
      scrollable,
      showHandle,

      // Layout styles
      containerStyle,
      sheetStyle,
      contentStyle,

      // Header-level
      showCloseButton,
      headerContent,
      headerStyle,
      closeBtnAccessibilityHint,
    } = options;

    /**
     * Choose scroll container based on wrapper-level option.
     */
    const ContentContainer = scrollable
      ? BottomSheetScrollView
      : BottomSheetView;

    /**
     * Gorhom behavior:
     * - handleComponent={undefined} → default handle
     * - handleComponent={null} → no handle
     */
    const resolvedHandleComponent = showHandle === true ? undefined : null;

    let backdropComponent: GbsBottomSheetModalProps['backdropComponent'];

    if (!disableBackdrop) {
      backdropComponent = (backdropProps) => (
        <BottomSheetBackdrop {...backdropProps} opacity={backdropOpacity} />
      );
    }

    return (
      <GbsBottomSheetModal
        ref={ref}
        {...gorhomProps}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        handleComponent={resolvedHandleComponent}
        containerComponent={containerComponent}
        backdropComponent={backdropComponent}
        style={[styles.container, containerStyle]}
        backgroundStyle={[styles.sheet, sheetStyle]}
      >
        <ContentContainer style={[styles.content, contentStyle]}>
          <BottomSheetHeader
            onClose={showCloseButton ? onRequestClose : undefined}
            style={headerStyle}
            closeBtnAccessibilityHint={closeBtnAccessibilityHint}
          >
            {headerContent}
          </BottomSheetHeader>

          {children}
        </ContentContainer>
      </GbsBottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  /**
   * Modal wrapper (shadow/elevation).
   * Override via `containerStyle`.
   */
  container: {
    elevation: 12,
  },

  /**
   * Sheet surface panel (background + radius).
   * Override via `sheetStyle`.
   */
  sheet: {
    backgroundColor: 'white',
    borderTopRightRadius: BOTTOM_SHEET_RADIUS,
    borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
    overflow: 'hidden',
  },

  /**
   * Inner content layout (padding/spacing).
   * Override via `contentStyle`.
   */
  content: {
    ...BOTTOM_SHEET_PADDING,
  },
});

export { BottomSheetBase };
