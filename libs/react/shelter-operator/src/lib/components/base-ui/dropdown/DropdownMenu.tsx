import { Check, Search } from 'lucide-react';
import type { RefObject } from 'react';
import { Text } from '../text/text';
import { cn, Z_BACKDROP, Z_MENU } from './constants';
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
        className="bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col overflow-hidden"
      >
        {isSearchable && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Search size={16} />
            <input
              autoFocus
              type="text"
              className="flex-1 text-sm bg-transparent text-gray-900 placeholder:text-gray-400 border-none outline-hidden focus:outline-hidden focus:ring-0 focus:border-none"
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
          className="overflow-y-auto max-h-352"
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
                  className={cn(
                    ' px-4 py-3 cursor-pointer transition-colors',
                    active ? 'bg-blue-50' : '',
                    focused && !active && 'bg-gray-100',
                    !focused && !active && 'hover:bg-gray-50'
                  )}
                  onClick={() => onOptionClick(option)}
                  onMouseEnter={() => onFocusIndex(index)}
                >
                  <Text
                    variant="body"
                    className={cn(
                      'flex items-center justify-between',
                      active ? 'text-blue-600 font-medium' : 'text-gray-900'
                    )}
                  >
                    {option.label}
                    {active && <Check size={16} className="shrink-0" />}
                  </Text>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-3">
              <Text variant="body" className="text-gray-400 text-center">
                No results found
              </Text>
            </div>
          )}
        </div>

        {isMulti && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              type="button"
              className={cn(
                'transition-colors cursor-pointer',
                hasSelection ? '' : 'cursor-default'
              )}
              disabled={!hasSelection}
              onClick={onClearAll}
            >
              <Text
                variant="body"
                className={cn(
                  '',
                  hasSelection
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-300'
                )}
              >
                Clear all
              </Text>
            </button>
            <button
              type="button"
              className="cursor-pointer transition-colors"
              onClick={onClose}
            >
              <Text
                variant="body"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Done
              </Text>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
