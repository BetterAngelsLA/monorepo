/**
 * MenuSheet
 *
 * A controlled "actions menu" bottom sheet with sensible defaults.
 *
 * Thin declarative wrapper around `BottomSheetModalControlled` (the same
 * primitive `MediaPicker`/`CameraSheet` use):
 * - Applies the standard menu-sheet options (close button, dimmed backdrop,
 *   swipe-to-dismiss, replace stack) unless overridden via `options`.
 * - Renders `actions` as `MenuSheetActionBtn` rows.
 * - Dismisses its sheet automatically if the consumer unmounts while it is
 *   open (BottomSheetModalControlled cleans up on unmount), so a sheet never
 *   lingers above other screens.
 *
 * Usage:
 *
 *   <MenuSheet
 *     isOpen={isMenuOpen}
 *     onClose={() => setIsMenuOpen(false)}
 *     actions={[{ title: 'Copy', Icon: CopyIcon, onPress: () => {} }]}
 *   />
 */
import { ReactNode } from 'react';
import { BottomSheetModalControlled } from '../BottomSheet';
import type { BottomSheetOptions } from '../BottomSheet/types';
import type { TMenuSheetAction } from './MenuSheetActionBtn';
import { MenuSheetActionBtn } from './MenuSheetActionBtn';

/**
 * MenuSheet defaults — the standard "actions menu" UX. Consumers can override
 * any of these via the `options` prop (e.g. `showCloseButton: false`, a custom
 * `variant`, or `enablePanDownToClose: false`).
 */
const MENU_SHEET_DEFAULT_OPTIONS: BottomSheetOptions = {
  variant: 'default',
  showCloseButton: true,
  closeBtnAccessibilityHint: 'closes the menu',
  // Single-detent sheets need pan-down-to-close so swiping down (and the
  // backdrop press) can fully dismiss the sheet instead of only nudging it.
  enablePanDownToClose: true,
  backdropOpacity: 0.5,
  stackBehavior: 'replace',
};

interface IMenuSheetProps {
  /** Whether the menu sheet should be presented. */
  isOpen: boolean;
  /** Standard action rows, rendered via MenuSheetActionBtn. */
  actions?: TMenuSheetAction[];
  /** Extra/custom content rendered after the action rows. */
  children?: ReactNode;
  /** Fired when the USER dismisses the sheet (X / backdrop / swipe down). */
  onClose?: () => void;
  /** Fired immediately when the USER initiates the close, before the exit animation. */
  onRequestClose?: () => void;
  /**
   * BottomSheet configuration. MenuSheet defaults are applied automatically —
   * pass only the overrides you need.
   */
  options?: BottomSheetOptions;
}

export function MenuSheet({
  isOpen,
  actions,
  children,
  onClose,
  onRequestClose,
  options,
}: IMenuSheetProps) {
  return (
    <BottomSheetModalControlled
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onRequestClose}
      options={{ ...MENU_SHEET_DEFAULT_OPTIONS, ...options }}
    >
      {actions?.map((action, idx) => (
        <MenuSheetActionBtn key={action.testId ?? idx} {...action} />
      ))}
      {children}
    </BottomSheetModalControlled>
  );
}
