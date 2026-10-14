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
 *     - top bar (`BottomSheetTopBar`) as Gorhom's handle, when the sheet has
 *       top-bar content
 *     - content container
 *
 * This component does NOT:
 * - manage state
 * - resolve options
 * - control stacking or lifecycle
 * - own any option defaults (authoritative source: `DEFAULT_BOTTOM_SHEET_OPTIONS`)
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
import { forwardRef, ReactNode, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { BOTTOM_SHEET_PADDING, BOTTOM_SHEET_RADIUS } from '../constants';
import { BottomSheetOptions } from '../types';
import { BottomSheetBackdrop } from './BottomSheetBackdrop';
import { BottomSheetTopBar, BottomSheetTopBarProps } from './BottomSheetTopBar';

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

/**
 * Builds the component Gorhom renders as the sheet's handle.
 *
 * Defined at module scope so no new component type is created inside the render
 * pass — React would otherwise remount the handle band on every render — and so
 * it doesn't trip the `no-nested-component-definitions` lint rule.
 */
function createTopBarHandle(config: BottomSheetTopBarProps) {
  return function TopBarHandle() {
    return <BottomSheetTopBar {...config} />;
  };
}

const BottomSheetBase = forwardRef<GbsBottomSheetModal, TBottomSheetModal>(
  function BottomSheetModal(props, ref) {
    const { children, onRequestClose, options, ...gorhomProps } = props;

    /**
     * Latest `onRequestClose`, held in a ref.
     *
     * The Provider passes a fresh arrow on every render, so depending on it
     * directly would invalidate the handle memo below on every render — the
     * exact remount that memo exists to prevent. Reading through a ref keeps
     * the memo's identity stable without going stale.
     */
    const onRequestCloseRef = useRef(onRequestClose);

    useEffect(() => {
      onRequestCloseRef.current = onRequestClose;
    }, [onRequestClose]);

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
      overDragResistanceFactor,
      containerComponent,
      accessible,

      // Wrapper-level
      disableBackdrop,
      backdropOpacity,
      scrollable,
      showHandle,
      topBarProps,

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
     * The bar mounts only when it has something to render.
     */
    const hasTopBarContent =
      showHandle === true ||
      !!showCloseButton ||
      !!headerContent ||
      !!topBarProps?.header ||
      !!topBarProps?.leftSlot;

    /**
     * The component Gorhom renders as the sheet's handle — the unified
     * `BottomSheetTopBar`, or `null` when the sheet has no top-bar content.
     *
     * Memoized so the component identity stays stable across renders — Gorhom
     * remounts the handle band when the component reference changes. Nothing
     * render-scoped is captured directly: `onRequestClose` is read through its
     * ref (above) so this does not depend on the Provider's per-render arrow.
     */
    const HandleComponent = useMemo(() => {
      if (!hasTopBarContent) {
        return null;
      }

      return createTopBarHandle({
        header: headerContent,
        headerStyle,
        closeBtnAccessibilityHint,
        ...topBarProps,
        // Sheet-owned behaviour — a caller-supplied value is ignored:
        // `showHandle` gates the indicator, `onClose` is the dismissal path.
        showHandle,
        onClose: showCloseButton
          ? () => onRequestCloseRef.current?.()
          : undefined,
      });
    }, [
      hasTopBarContent,
      topBarProps,
      showHandle,
      showCloseButton,
      closeBtnAccessibilityHint,
      headerContent,
      headerStyle,
    ]);

    /**
     * The component Gorhom renders as the backdrop, or `undefined` when the
     * sheet has no backdrop.
     *
     * Memoized for the same reason as the handle: Gorhom renders
     * `backdropComponent` as a component *type*, so a fresh arrow each render
     * remounts the backdrop — and its touch-through `pointerEvents` state is
     * derived from `useAnimatedReaction`, so it re-initialises on that remount.
     * `onRequestClose` is read through its ref (above) so this stays
     * independent of the Provider's per-render arrow.
     */
    const BackdropComponent = useMemo<
      GbsBottomSheetModalProps['backdropComponent']
    >(() => {
      if (disableBackdrop) {
        return undefined;
      }

      return (backdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          opacity={backdropOpacity}
          onRequestClose={() => onRequestCloseRef.current?.()}
        />
      );
    }, [disableBackdrop, backdropOpacity]);

    return (
      <GbsBottomSheetModal
        ref={ref}
        accessible={accessible}
        {...gorhomProps}
        snapPoints={snapPoints}
        overDragResistanceFactor={overDragResistanceFactor}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        handleComponent={HandleComponent}
        containerComponent={containerComponent}
        backdropComponent={BackdropComponent}
        style={[styles.container, containerStyle]}
        backgroundStyle={[styles.sheet, sheetStyle]}
      >
        <ContentContainer style={[styles.content, contentStyle]}>
          {children}
        </ContentContainer>
      </GbsBottomSheetModal>
    );
  },
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
