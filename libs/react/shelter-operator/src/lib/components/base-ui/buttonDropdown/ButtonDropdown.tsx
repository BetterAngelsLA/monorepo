import {
  ButtonHTMLAttributes,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { ButtonColor, ButtonVariant } from '../buttons/buttons';
import { Button } from '../buttons/buttons';
import { MenuOption } from '../dropdown/MenuOption';
import { MenuPanel } from '../dropdown/MenuPanel';
import { usePortalPosition } from '../dropdown/usePortalPosition';

export type ButtonDropdownItem<T extends string | number = string> = {
  value: T;
  label: string;
};

type TProps<T extends string | number = string> = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onSelect' | 'onClick'
> & {
  children: ReactNode;
  items: ButtonDropdownItem<T>[];
  onSelect: (item: ButtonDropdownItem<T>) => void;
  variant?: ButtonVariant;
  color?: ButtonColor;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Which edge of the trigger the menu aligns to. Defaults to `'left'`. */
  menuAlign?: 'left' | 'right';
};

export function ButtonDropdown<T extends string | number = string>(
  props: TProps<T>
) {
  const {
    children,
    items,
    onSelect,
    variant,
    color,
    disabled,
    className,
    leftIcon,
    rightIcon,
    menuAlign = 'left',
    ...rest
  } = props;

  const [isOpen, setIsOpen] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  const menuPos = usePortalPosition(anchorRef, isOpen, close, menuRef);

  function handleSelect(item: ButtonDropdownItem<T>) {
    close();
    onSelect(item);
  }

  return (
    <div ref={anchorRef} className="relative w-fit">
      <Button
        variant={variant}
        color={color}
        disabled={disabled}
        className={className}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) setIsOpen((v) => !v);
        }}
        {...rest}
      >
        {children}
      </Button>

      {isOpen &&
        createPortal(
          <MenuPanel
            menuRef={menuRef}
            menuPos={menuPos}
            onClose={close}
            align={menuAlign}
          >
            <div role="menu" className="space-y-1 px-2 py-2">
              {items.map((item) => (
                <MenuOption
                  key={item.value}
                  role="menuitem"
                  onClick={() => handleSelect(item)}
                >
                  {item.label}
                </MenuOption>
              ))}
            </div>
          </MenuPanel>,
          document.body
        )}
    </div>
  );
}
