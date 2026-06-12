import { mergeCss } from '@monorepo/react/shared';
import type { HTMLAttributes, ReactNode } from 'react';
import { Text } from '../text/text';

type MenuOptionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  active?: boolean;
  focused?: boolean;
};

/**
 * Single option row shared by `DropdownMenu` (listbox options) and
 * `ButtonDropdown` (menu items). Ensures identical typography and
 * hover/active/focused states everywhere.
 */
export function MenuOption({
  children,
  active = false,
  focused = false,
  className,
  ...rest
}: MenuOptionProps) {
  return (
    <div
      className={mergeCss([
        'cursor-pointer rounded-lg px-3 py-2.5 transition-colors',
        active ? 'bg-blue-50' : '',
        focused && !active ? 'bg-gray-100' : '',
        !focused && !active ? 'hover:bg-gray-50' : '',
        className,
      ])}
      {...rest}
    >
      <Text
        variant="body"
        className={mergeCss([
          'flex items-center justify-between',
          active ? 'text-[#008CEE]' : 'text-gray-900',
        ])}
      >
        {children}
      </Text>
    </div>
  );
}
