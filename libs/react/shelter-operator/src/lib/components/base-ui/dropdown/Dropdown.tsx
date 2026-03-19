import { ChevronDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from './constants';
import { DropdownChips } from './DropdownChips';
import { DropdownMenu } from './DropdownMenu';
import type {
  DropdownInternalProps,
  DropdownOption,
  DropdownProps,
} from './types';
import { usePortalPosition } from './usePortalPosition';

export function Dropdown<T extends string | number = string | number>(
  props: DropdownProps<T>
) {
  const {
    label,
    placeholder = 'Please select',
    options,
    value,
    onChange,
    isMulti = false,
    isSearchable = false,
    required = false,
    disabled = false,
    className,
  } = props as DropdownInternalProps<T>;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
  }, []);
  const menuId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const labelId = `${menuId}-label`;

  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalPosition(triggerRef, isOpen, close, menuRef);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[focusedIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  // Reset focused index when search query changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery]);

  // ── Derived state ──────────────────────────────────────────────────────

  const selectedValues = useMemo(
    () =>
      (value
        ? Array.isArray(value)
          ? value
          : [value]
        : []) as DropdownOption<T>[],
    [value]
  );

  const hasSelection = selectedValues.length > 0;

  const selectedSet = useMemo(
    () => new Set(selectedValues.map((v) => v.value)),
    [selectedValues]
  );

  const filteredOptions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // ── Callbacks ──────────────────────────────────────────────────────────

  const emitChange = useCallback(
    (values: DropdownOption<T>[]) => {
      onChange(
        isMulti ? (values.length > 0 ? values : null) : values[0] ?? null
      );
    },
    [onChange, isMulti]
  );

  const handleOptionClick = useCallback(
    (option: DropdownOption<T>) => {
      if (isMulti) {
        const next = selectedSet.has(option.value)
          ? selectedValues.filter((v) => v.value !== option.value)
          : [...selectedValues, option];
        emitChange(next);
      } else {
        emitChange([option]);
        close();
      }
    },
    [isMulti, selectedSet, selectedValues, emitChange, close]
  );

  const handleRemoveChip = useCallback(
    (option: DropdownOption<T>) => {
      emitChange(selectedValues.filter((v) => v.value !== option.value));
    },
    [selectedValues, emitChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          close();
          triggerRef.current?.focus();
          break;
        case 'Tab':
          close();
          break;
        case 'Enter':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else if (
            focusedIndex >= 0 &&
            focusedIndex < filteredOptions.length
          ) {
            handleOptionClick(filteredOptions[focusedIndex]);
          }
          break;
        case ' ':
          if (!(e.target instanceof HTMLInputElement)) {
            e.preventDefault();
            if (!isOpen) setIsOpen(true);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex((i) =>
              i < filteredOptions.length - 1 ? i + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((i) =>
              i > 0 ? i - 1 : filteredOptions.length - 1
            );
          }
          break;
      }
    },
    [close, isOpen, focusedIndex, filteredOptions, handleOptionClick]
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className={cn('relative flex flex-col gap-1 w-full', className)}>
      {label && (
        <label id={labelId} className="text-sm text-gray-900">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-labelledby={label ? labelId : undefined}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'relative flex items-center justify-between gap-2 w-full px-4 rounded-full border bg-white cursor-pointer select-none transition-colors h-12',
          isOpen ? 'border-[#008CEE]' : 'border-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => {
          if (!disabled) setIsOpen((o) => !o);
        }}
        onKeyDown={handleKeyDown}
      >
        {isMulti && hasSelection ? (
          <DropdownChips
            selectedValues={selectedValues}
            onRemove={handleRemoveChip}
          />
        ) : (
          <span
            className={cn(
              'text-sm flex-1 truncate',
              hasSelection ? 'text-gray-900' : 'text-gray-400'
            )}
          >
            {hasSelection ? selectedValues[0].label : placeholder}
          </span>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 shrink-0 transition-transform duration-200 text-gray-400 z-10',
            isOpen && 'rotate-180',
            isMulti && hasSelection && 'ml-auto'
          )}
        />
      </div>

      {isOpen &&
        createPortal(
          <DropdownMenu
            menuId={menuId}
            menuPos={menuPos}
            isSearchable={isSearchable}
            isMulti={isMulti}
            hasSelection={hasSelection}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filteredOptions={filteredOptions}
            selectedSet={selectedSet}
            focusedIndex={focusedIndex}
            onFocusIndex={setFocusedIndex}
            onOptionClick={handleOptionClick}
            onClearAll={() => emitChange([])}
            onClose={close}
            onKeyDown={handleKeyDown}
            listRef={listRef}
            menuRef={menuRef}
          />,
          document.body
        )}
    </div>
  );
}
