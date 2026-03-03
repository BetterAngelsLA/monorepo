/**
 * BottomSheetBase
 *
 * Presentation-layer wrapper around `@gorhom/bottom-sheet`.
 *
 * Responsibilities:
 * - Receives fully resolved `BottomSheetOptions`
 * - Maps wrapper-level options to Gorhom props
 * - Controls:
 *     - Handle visibility
 *     - Backdrop behavior
 *     - Scroll container selection
 *     - Header rendering
 *     - Container selection (`containerComponent`)
 * - Applies design-system styling (radius, padding, elevation)
 *
 * This component does NOT:
 * - Resolve variants
 * - Merge defaults
 * - Manage stacking
 * - Control lifecycle
 *
 * All configuration resolution happens upstream in:
 *   `resolveBottomSheetOptions`
 *
 * All lifecycle and stacking logic happens in:
 *   `BottomSheetModalProvider`
 *
 * This component is intentionally "dumb" and render-focused.
 */

import {
  BottomSheetBackdropProps,
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

    return (
      <GbsBottomSheetModal
        ref={ref}
        {...gorhomProps}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        handleComponent={resolvedHandleComponent}
        containerComponent={containerComponent}
        backdropComponent={(backdropProps: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...backdropProps}
            disableBackdrop={disableBackdrop}
            opacity={backdropOpacity}
          />
        )}
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
