import { BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

/**
 * Variants
 *
 * represent high-level UX modes.
 *
 * They influence default styling and behavior but do NOT directly
 * render anything. Resolution happens in `resolveBottomSheetOptions`.
 */
export type BottomSheetVariant = 'default' | 'bare';

/**
 * Gorhom-Level Options
 *
 * Options that are understood directly by `@gorhom/bottom-sheet`.
 *
 * These map 1:1 to Gorhom props and can safely be passed through
 * to `GbsBottomSheetModal`.
 */
export type BottomSheetGorhomOptions = Pick<
  BottomSheetModalProps,
  'snapPoints' | 'enableDynamicSizing' | 'enablePanDownToClose'
>;

/**
 * Provider-Level Options (Lifecycle & Stacking)
 *
 * These options are consumed exclusively by `BottomSheetModalProvider`.
 *
 * They control:
 * - Stacking behavior (push | switch | replace)
 * - Lifecycle side-effects when the sheet is dismissed
 *
 * These do NOT affect rendering directly.
 */
export type BottomSheetProviderOptions = {
  /**
   * Determines how the new sheet interacts with existing sheets.
   *
   * - 'push': stack on top
   * - 'switch': replace only the top sheet
   * - 'replace': dismiss all existing sheets (default)
   */
  stackBehavior?: BottomSheetModalProps['stackBehavior'];

  /**
   * Optional callback invoked after the sheet is fully dismissed.
   */
  onClose?: () => void;
};

/**
 * Wrapper-Level Options (Sheet Structure & Layout)
 *
 * These options affect sheet structure and rendering behavior,
 * -  not part of Gorhom's API
 * -  interpreted by `BottomSheetBase`
 */
export type BottomSheetWrapperOptions = {
  /**
   * If true, uses BottomSheetScrollView for content container.
   * Otherwise uses BottomSheetView.
   */
  scrollable?: boolean;

  /**
   * Disables rendering of backdrop.
   */
  disableBackdrop?: boolean;

  /**
   * Opacity of the backdrop overlay.
   */
  backdropOpacity?: number;

  /**
   * Maximum height constraint for the sheet.
   * (Optional structural constraint)
   */
  maxHeight?: number;

  /**
   * Controls visibility of the Gorhom handle.
   *
   * If undefined, resolved dynamically based on variant + snapPoints.
   */
  showHandle?: boolean;
};

/**
 * Header-Level Options
 *
 * These options control rendering of the `BottomSheetHeader`
 * component and do NOT belong to Gorhom.
 */
export interface BottomSheetHeaderOptions {
  /**
   * Whether to render the close button inside the header.
   */
  showCloseButton?: boolean;

  /**
   * Optional content rendered inside the header area.
   */
  headerContent?: ReactNode;

  /**
   * Style applied to the header container.
   */
  headerStyle?: StyleProp<ViewStyle>;

  /**
   * Accessibility hint for the close button.
   */
  closeBtnAccessibilityHint?: string;
}

/**
 * Public BottomSheetOptions
 *
 * This is the single configuration object callers use.
 *
 * Resolution order:
 *   DEFAULT_BOTTOM_SHEET_OPTIONS
 *     → BOTTOM_SHEET_VARIANT_OPTIONS
 *       → user-provided options
 *
 * Dynamic behavior (like handle resolution) is finalized in
 * `resolveBottomSheetOptions`.
 */
export type BottomSheetOptions = BottomSheetGorhomOptions &
  BottomSheetProviderOptions &
  BottomSheetWrapperOptions &
  BottomSheetHeaderOptions & {
    /**
     * High-level UX mode.
     */
    variant?: BottomSheetVariant;

    /**
     * Outer wrapper style (shadow/elevation/etc).
     * Maps to `GbsBottomSheetModal` `style`.
     */
    containerStyle?: StyleProp<ViewStyle>;

    /**
     * Surface/panel style (background/radius/border).
     * Maps to `GbsBottomSheetModal` `backgroundStyle`.
     */
    sheetStyle?: StyleProp<ViewStyle>;

    /**
     * Inner content layout style (padding/spacing).
     * Applied to BottomSheetView / BottomSheetScrollView.
     */
    contentStyle?: StyleProp<ViewStyle>;
  };

/**
 * Render API
 *
 * Passed to caller-provided render function.
 */
export type BottomSheetRenderApi = {
  /**
   * Imperatively closes the current sheet.
   */
  closeSheet: () => void;
};

/**
 * Parameters for `showBottomSheet`.
 */
export type ShowBottomSheetParams = {
  /**
   * Render function invoked inside the sheet.
   * Receives `{ closeSheet }` helper.
   */
  render: (api: BottomSheetRenderApi) => ReactNode;

  /**
   * Optional configuration object.
   */
  options?: BottomSheetOptions;
};

/**
 * Context API exposed by BottomSheetModalProvider.
 */
export type BottomSheetContextValue = {
  /**
   * Opens a new bottom sheet.
   */
  showBottomSheet: (params: ShowBottomSheetParams) => void;

  /**
   * Dismisses only the top-most sheet.
   */
  popTopSheet: () => void;
};
