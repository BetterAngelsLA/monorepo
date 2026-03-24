/**
 * useBottomSheet
 *
 * Primary entry point for interacting with the BottomSheet system.
 *
 * This hook exposes an imperative API for presenting and dismissing sheets,
 * without requiring callers to manage component state, refs, or lifecycle.
 *
 * --------------------------------------------------------------------------
 * MENTAL MODEL
 * --------------------------------------------------------------------------
 *
 * Bottom sheets are managed as a **stack**:
 *
 * - Each call to `showBottomSheet()` creates a new sheet instance
 * - Sheets are rendered by the provider (not inline where this hook is used)
 * - The last sheet added is the top-most visible sheet
 *
 * Behavior when opening a new sheet is controlled by `stackBehavior`:
 *
 * - 'push'    → add on top of existing sheets
 * - 'switch'  → replace only the top sheet
 * - 'replace' → dismiss all existing sheets (default)
 *
 *
 * --------------------------------------------------------------------------
 * CORE API
 * --------------------------------------------------------------------------
 *
 * showBottomSheet(params)
 *
 * Opens a new sheet.
 *
 * Required:
 * - render: function that returns the sheet content
 *
 * Optional:
 * - options: configuration object controlling behavior, layout, and styling
 *
 *
 * popTopSheet()
 *
 * Dismisses the top-most sheet only.
 *
 *
 * --------------------------------------------------------------------------
 * RENDER FUNCTION
 * --------------------------------------------------------------------------
 *
 * The `render` function receives a small API:
 *
 * - closeSheet(): imperatively dismisses the current sheet
 *
 * This allows sheet content to control its own lifecycle without
 * needing access to provider internals.
 *
 *
 * --------------------------------------------------------------------------
 * OPTIONS OVERVIEW
 * --------------------------------------------------------------------------
 *
 * The `options` object is the single configuration surface.
 *
 * It combines multiple layers:
 *
 * - Gorhom options        (snapPoints, enablePanDownToClose, etc.)
 * - Provider options      (stackBehavior, onClose)
 * - Wrapper options       (scrollable, backdrop, layout)
 * - Header options        (headerContent, close button, styles)
 *
 * Options are resolved in this order:
 *
 *   provider defaults
 *     → showBottomSheet options
 *       → internal resolution (variants, dynamic defaults)
 *
 * Callers should treat `options` as declarative configuration,
 * not as direct Gorhom props.
 *
 *
 * --------------------------------------------------------------------------
 * USAGE PATTERNS
 * --------------------------------------------------------------------------
 *
 * Basic:
 *
 * const { showBottomSheet } = useBottomSheet();
 *
 * showBottomSheet({
 *   render: () => <SimpleContent />,
 * });
 *
 *
 * With snap points:
 *
 * showBottomSheet({
 *   options: {
 *     snapPoints: ['50%', '90%'],
 *   },
 *   render: () => <ScrollableContent />,
 * });
 *
 *
 * With close control:
 *
 * showBottomSheet({
 *   options: {
 *     showCloseButton: true,
 *     headerContent: <Text>Title</Text>,
 *   },
 *   render: ({ closeSheet }) => (
 *     <View>
 *       <Button onPress={closeSheet} />
 *     </View>
 *   ),
 * });
 *
 *
 * With stacking:
 *
 * showBottomSheet({
 *   options: { stackBehavior: 'push' },
 *   render: () => <AnotherSheet />,
 * });
 *
 *
 * --------------------------------------------------------------------------
 * REQUIREMENTS
 * --------------------------------------------------------------------------
 *
 * This hook must be used within `BottomSheetModalProvider`.
 *
 * The provider is responsible for:
 * - rendering sheets
 * - resolving options
 * - managing stacking and lifecycle
 *
 *
 * --------------------------------------------------------------------------
 * DESIGN NOTES
 * --------------------------------------------------------------------------
 *
 * - This API is intentionally imperative (not state-driven)
 * - Callers do not render sheets directly
 * - All rendering is centralized in the provider
 * - The system abstracts `@gorhom/bottom-sheet` behind a stable interface
 */

import { useContext } from 'react';
import { BottomSheetContext } from './BottomSheetContext';

export function useBottomSheet() {
  const ctx = useContext(BottomSheetContext);

  if (!ctx) {
    throw new Error('useBottomSheet must be used within BottomSheetProvider');
  }

  return ctx;
}
