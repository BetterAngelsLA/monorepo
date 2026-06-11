import { mergeCss } from '@monorepo/react/shared';
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
import { Label } from '../label';
import { Text } from '../text/text';
import { DropdownChips } from './DropdownChips';
import { DropdownMenu } from './DropdownMenu';
import type {
  DropdownInternalProps,
  DropdownOption,
  DropdownProps,
} from './types';
import { usePortalPosition } from './usePortalPosition';

const CREATE_OPTION_VALUE = '__dropdown_create__';
const OTHER_OPTION_VALUE = '__dropdown_other__';

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
    onCreateOption,
    createOptionLabel,
    isViewMode,
    required = false,
    disabled = false,
    className,
    onOtherTextChange,
    renderValue,
  } = props as DropdownInternalProps<T>;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [otherDetailText, setOtherDetailText] = useState('');

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
  }, []);
  const menuId = useId();
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const labelId = `${menuId}-label`;

  const menuRef = useRef<HTMLDivElement>(null);
  const menuPos = usePortalPosition(menuAnchorRef, isOpen, close, menuRef);

  const isViewEditMode = typeof isViewMode === 'boolean';

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

  const otherSelected = useMemo(
    () => selectedValues.some((v) => String(v.value) === OTHER_OPTION_VALUE),
    [selectedValues]
  );

  const prevOtherSelectedRef = useRef(otherSelected);

  useEffect(() => {
    if (!otherSelected) {
      setOtherDetailText('');
      if (prevOtherSelectedRef.current) {
        onOtherTextChange?.('');
      }
    }
    prevOtherSelectedRef.current = otherSelected;
  }, [otherSelected, onOtherTextChange]);

  // Multi-select trigger grows and uses rounded rectangle styling
  const isStackedMultiSelect =
    isMulti && hasSelection && selectedValues.length > 1;

  const selectedSet = useMemo(
    () => new Set(selectedValues.map((v) => v.value)),
    [selectedValues]
  );

  const selectedLabelSet = useMemo(
    () => new Set(selectedValues.map((v) => v.label.trim().toLowerCase())),
    [selectedValues]
  );

  const trimmedSearchQuery = searchQuery.trim();
  const normalizedSearchQuery = trimmedSearchQuery.toLowerCase();

  const hasExactOptionLabel = useMemo(
    () =>
      options.some(
        (option) => option.label.trim().toLowerCase() === normalizedSearchQuery
      ),
    [options, normalizedSearchQuery]
  );

  const showCreateOption =
    Boolean(onCreateOption) &&
    Boolean(trimmedSearchQuery) &&
    !hasExactOptionLabel &&
    !selectedLabelSet.has(normalizedSearchQuery);

  const menuOptionsWithoutOther = useMemo(
    () => options.filter((o) => String(o.value) !== OTHER_OPTION_VALUE),
    [options]
  );

  const filteredOptions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const main = menuOptionsWithoutOther.filter((o) =>
      o.label.toLowerCase().includes(query)
    );

    const withOther = onOtherTextChange
      ? [
          ...main,
          {
            label: 'Other',
            value: OTHER_OPTION_VALUE as T,
          } as DropdownOption<T>,
        ]
      : main;

    if (!showCreateOption) {
      return withOther;
    }

    return [
      {
        label:
          createOptionLabel?.(trimmedSearchQuery) ??
          `Add "${trimmedSearchQuery}"`,
        value: CREATE_OPTION_VALUE as T,
      },
      ...withOther,
    ];
  }, [
    menuOptionsWithoutOther,
    searchQuery,
    onOtherTextChange,
    showCreateOption,
    createOptionLabel,
    trimmedSearchQuery,
  ]);

  // ── Callbacks ──────────────────────────────────────────────────────────

  const emitChange = useCallback(
    (values: DropdownOption<T>[]) => {
      onChange(
        isMulti ? (values.length > 0 ? values : null) : values[0] ?? null
      );
    },
    [onChange, isMulti]
  );

  const handleCreateOption = useCallback(() => {
    if (!showCreateOption || !onCreateOption) {
      return;
    }

    void onCreateOption(trimmedSearchQuery);
    setSearchQuery('');
    setFocusedIndex(-1);
  }, [showCreateOption, onCreateOption, trimmedSearchQuery]);

  const handleOptionClick = useCallback(
    (option: DropdownOption<T>) => {
      if (String(option.value) === CREATE_OPTION_VALUE) {
        handleCreateOption();
        return;
      }

      if (isMulti) {
        const next = selectedSet.has(option.value)
          ? selectedValues.filter((v) => v.value !== option.value)
          : [...selectedValues, option];
        emitChange(next);
      } else {
        if (selectedSet.has(option.value)) {
          onChange(null);
        } else {
          emitChange([option]);
        }
        close();
      }
    },
    [
      isMulti,
      selectedSet,
      selectedValues,
      emitChange,
      close,
      handleCreateOption,
    ]
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
              filteredOptions.length === 0
                ? -1
                : i < filteredOptions.length - 1
                ? i + 1
                : 0
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((i) =>
              filteredOptions.length === 0
                ? -1
                : i > 0
                ? i - 1
                : filteredOptions.length - 1
            );
          }
          break;
      }
    },
    [close, isOpen, focusedIndex, filteredOptions, handleOptionClick]
  );

  // ── Render ─────────────────────────────────────────────────────────────

  function renderSelectionContent() {
    if (!hasSelection) {
      return (
        <span className="text-sm flex-1 truncate">
          <Text
            variant="body"
            className="text-sm flex-1 truncate text-gray-400"
          >
            {placeholder}
          </Text>
        </span>
      );
    }

    if (renderValue) {
      return renderValue(selectedValues);
    }

    if (isMulti) {
      return (
        <DropdownChips
          selectedValues={selectedValues}
          onRemove={isViewMode ? undefined : handleRemoveChip}
        />
      );
    }

    return (
      <span className="text-sm flex-1 truncate">
        <Text variant="body" className="text-sm flex-1 truncate text-gray-900">
          {selectedValues[0].label}
        </Text>
      </span>
    );
  }

  return (
    <div
      className={mergeCss([
        'relative flex w-full flex-col gap-1 font-sans',
        className,
      ])}
    >
      {label && (
        <Label
          label={label}
          inputId={labelId}
          variant={isViewEditMode ? 'offset' : undefined}
          required={required}
        />
      )}

      <div ref={menuAnchorRef} className="flex w-full flex-col gap-1">
        <div
          ref={triggerRef}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-labelledby={label ? labelId : undefined}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className={mergeCss([
            'relative flex justify-between gap-2 w-full border bg-white cursor-pointer select-none transition-colors duration-200',
            isStackedMultiSelect
              ? 'min-h-12 items-start rounded-2xl px-4 py-3'
              : 'h-12 items-center rounded-full px-4 overflow-hidden',
            isOpen ? 'border-[#008CEE]' : 'border-gray-200',
            isViewMode && 'border-transparent',
            disabled && 'opacity-50 cursor-not-allowed',
          ])}
          onClick={() => {
            if (!disabled && !isViewMode) {
              setIsOpen((o) => !o);
            }
          }}
          onKeyDown={isViewMode ? undefined : handleKeyDown}
        >
          {renderSelectionContent()}

          {!isViewMode && (
            <ChevronDown
              className={mergeCss([
                'w-4 h-4 shrink-0 transition-transform duration-200 text-gray-400 z-10',
                isOpen && 'rotate-180',
                isStackedMultiSelect && 'self-start mt-1.5',
              ])}
            />
          )}
        </div>

        {otherSelected && (
          <input
            type="text"
            aria-label="Specify other"
            disabled={disabled}
            value={otherDetailText}
            placeholder="Please specify..."
            className={mergeCss([
              'w-full h-12 rounded-full border bg-white px-4 font-sans text-sm transition-colors duration-200',
              'text-gray-900 placeholder:text-gray-400',
              'border-gray-200 outline-none focus:border-[#008CEE]',
              disabled && 'cursor-not-allowed opacity-50',
            ])}
            onChange={(e) => {
              const next = e.target.value;
              setOtherDetailText(next);
              onOtherTextChange?.(next);
            }}
          />
        )}
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
