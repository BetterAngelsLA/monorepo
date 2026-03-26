/**
 * BottomSheetOptions
 *
 * Unified configuration object passed to `showBottomSheet()`.
 *
 * This combines:
 * - Gorhom options (behavior)
 * - Provider options (stacking, lifecycle)
 * - Wrapper options (layout, backdrop, structure)
 * - Header options (UI)
 *
 * Resolution order:
 *   provider defaults
 *     → showBottomSheet options
 *       → internal resolution
 *
 * See `useBottomSheet` for usage examples and mental model.
 */

import { BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { ComponentType, ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export type StackBehavior = BottomSheetModalProps['stackBehavior'];

export type BottomSheetProviderConfig = {
  /**
   * App-level default options applied to every sheet.
   * Can be overridden via showBottomSheet().
   */
  defaultOptions?: BottomSheetOptions;

  /**
   * When enabled, the provider renders a single shared backdrop
   * instead of one backdrop per sheet.
   *
   * This is useful when using `FullWindowOverlay`, where multiple
   * Gorhom backdrops can race and render above sheets.
   */
  enableSharedBackdrop?: boolean;

  /**
   * Enables the layout measurement system used to calculate
   * container height for bottom sheets.
   *
   * Disable this when the app manages sheet layout externally
   * or when container height should not be overridden.
   *
   * Default: true
   */
  enableLayoutProvider?: boolean;
};

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
  stackBehavior?: StackBehavior;

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

    /**
     * Optional container override used by `@gorhom/bottom-sheet`.
     * Typically configured globally via `BottomSheetProviderConfig`.
     *
     * Allows rendering the sheet inside a custom wrapper instead of the
     * default root container.
     *
     * This is primarily used to solve z-index issues when using native
     * navigation stacks (e.g. `react-native-screens` or modal screens),
     * where the BottomSheet may otherwise render *behind* the current screen.
     */
    containerComponent?: ComponentType<{ children?: ReactNode }>;
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
   * Parameters for `showBottomSheet()`.
   *
   * See `useBottomSheet` for full usage documentation.
   */
  render: (api: BottomSheetRenderApi) => ReactNode;
  options?: BottomSheetOptions;
};

/**
 * Context API exposed by BottomSheetModalProvider.
 */
export type BottomSheetContextValue = {
  /**
   * Context API exposed via `useBottomSheet()`.
   *
   * Do not consume directly — use the hook instead.
   */
  showBottomSheet: (params: ShowBottomSheetParams) => void;
  popTopSheet: () => void;
};
