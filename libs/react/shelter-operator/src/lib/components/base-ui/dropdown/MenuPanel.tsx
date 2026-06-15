import type { ReactNode, RefObject } from 'react';
import { Z_BACKDROP, Z_MENU } from './constants';

type MenuPanelProps = {
  menuRef: RefObject<HTMLDivElement | null>;
  menuPos: { top: number; left: number; width?: number };
  onClose: () => void;
  children: ReactNode;
  id?: string;
  /**
   * Which edge of the trigger the menu aligns to.
   * - `'left'` (default): menu left edge = trigger left edge, menu width matches trigger.
   * - `'right'`: menu right edge = trigger right edge, menu sizes to content.
   */
  align?: 'left' | 'right';
};

/**
 * Shared visual shell for portal-rendered menus: backdrop overlay + the
 * floating rounded container. Used by both `DropdownMenu` (combobox) and
 * `ButtonDropdown` (action menu).
 */
export function MenuPanel(props: MenuPanelProps) {
  const { menuRef, menuPos, onClose, children, id, align = 'left' } = props;

  const positionStyle =
    align === 'right'
      ? {
          position: 'fixed' as const,
          top: menuPos.top,
          right: window.innerWidth - (menuPos.left + (menuPos.width ?? 0)),
          zIndex: Z_MENU,
        }
      : {
          position: 'fixed' as const,
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          zIndex: Z_MENU,
        };

  return (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: Z_BACKDROP }}
        onClick={onClose}
      />
      <div
        ref={menuRef}
        id={id}
        className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white font-sans shadow-lg"
        style={positionStyle}
      >
        {children}
      </div>
    </>
  );
}
