import { mergeCss } from '@monorepo/react/shared';
import { Check, Search } from 'lucide-react';
import type { RefObject } from 'react';
import { Button } from '../buttons/buttons';
import { Text } from '../text/text';
import { Z_BACKDROP, Z_MENU } from './constants';
import type { DropdownOption } from './types';

interface DropdownMenuProps<T extends string | number> {
  menuId: string;
  menuPos: { top: number; left: number; width: number };
  isSearchable: boolean;
  isMulti: boolean;
  hasSelection: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredOptions: DropdownOption<T>[];
  selectedSet: Set<T>;
  focusedIndex: number;
  onFocusIndex: (index: number) => void;
  onOptionClick: (option: DropdownOption<T>) => void;
  onClearAll: () => void;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  listRef: RefObject<HTMLDivElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
}

export function DropdownMenu<T extends string | number>({
  menuId,
  menuPos,
  isSearchable,
  isMulti,
  hasSelection,
  searchQuery,
  onSearchChange,
  filteredOptions,
  selectedSet,
  focusedIndex,
  onFocusIndex,
  onOptionClick,
  onClearAll,
  onClose,
  onKeyDown,
  listRef,
  menuRef,
}: DropdownMenuProps<T>) {
  return (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: Z_BACKDROP }}
        onClick={onClose}
      />
      <div
        ref={menuRef}
        id={menuId}
        style={{
          position: 'fixed',
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          zIndex: Z_MENU,
        }}
        className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white font-sans shadow-lg"
      >
        {isSearchable && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Search size={16} />
            <input
              autoFocus
              type="text"
              className="flex-1 border-none bg-transparent font-sans text-sm text-gray-900 outline-hidden placeholder:text-gray-400 focus:border-none focus:outline-hidden focus:ring-0"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={onKeyDown}
            />
          </div>
        )}

        <div
          ref={listRef}
          role="listbox"
          className="max-h-[400px] space-y-1 overflow-y-auto px-2 py-2"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const active = selectedSet.has(option.value);
              const focused = index === focusedIndex;
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={active}
                  className={mergeCss([
                    'cursor-pointer rounded-lg px-3 py-2.5 transition-colors',
                    active ? 'bg-blue-50' : '',
                    focused && !active && 'bg-gray-100',
                    !focused && !active && 'hover:bg-gray-50',
                  ])}
                  onClick={() => onOptionClick(option)}
                  onMouseEnter={() => onFocusIndex(index)}
                >
                  <Text
                    variant="body"
                    className={mergeCss([
                      'flex items-center justify-between',
                      active ? 'text-[#008CEE]' : 'text-gray-900',
                    ])}
                  >
                    {option.label}
                    {active && <Check size={20} className="shrink-0" />}
                  </Text>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-3">
              <Text variant="body" className="text-center text-gray-400">
                No results found
              </Text>
            </div>
          )}
        </div>

        {isMulti && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
            <Button
              variant="primary-sm"
              disabled={!hasSelection}
              onClick={onClearAll}
            >
              Unselect All
            </Button>
            <Button variant="primary-sm" color="blue" onClick={onClose}>
              Apply
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
