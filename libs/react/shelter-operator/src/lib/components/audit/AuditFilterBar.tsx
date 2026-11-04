import type { AuditTargetType } from '@monorepo/ba-platform/types';
import { mergeCss, useDebounce } from '@monorepo/react/shared';
import { X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { AuditActorOption, ObjectAuditLogFilters } from '../../hooks';
import { MIN_ACTOR_SEARCH_LENGTH, useAuditActors } from '../../hooks';
import { Button } from '../base-ui/buttons';
import { Input } from '../base-ui/input';
import { Text } from '../base-ui/text/text';
import {
  DateRangeFilter,
  resolvePresetValue,
  type DateRange,
  type DateRangePresetValue,
} from '../date-range-filter';
import {
  DEFAULT_AUDIT_PRESET,
  rangeToFilters,
  type AuditActorSelection,
} from './auditFilters';

/** How long to wait after the last keystroke before querying actors. */
const ACTOR_SEARCH_DEBOUNCE_MS = 300;

/**
 * Actor filter: an on-demand, debounced search over the actors that appear in
 * the object's own audit history.
 *
 * Nothing is requested until the term is at least two characters (the backend's
 * own floor).
 */
function ActorFilter({
  targetType,
  objectId,
  selection,
  onChange,
}: {
  targetType: AuditTargetType;
  objectId: string;
  selection: AuditActorSelection | null;
  onChange: (selection: AuditActorSelection | null) => void;
}) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, ACTOR_SEARCH_DEBOUNCE_MS);
  const { options, loading, error, refetch } = useAuditActors({
    targetType,
    objectId,
    search: debouncedSearch,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  // Committing swaps the combobox for the chip and clearing swaps it back, so
  // the focused element unmounts. Remember where focus should land instead:
  // only a change this control caused moves it, never a caller re-seeding.
  const focusTargetRef = useRef<'clear' | 'input' | null>(null);
  const listboxId = useId();

  useEffect(() => {
    const target = focusTargetRef.current;

    if (!target) {
      return;
    }

    focusTargetRef.current = null;

    if (target === 'clear') {
      clearButtonRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [selection]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  // A new result set starts with no active option.
  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }
    const item = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex]);

  const term = debouncedSearch.trim();
  const canSearch = term.length >= MIN_ACTOR_SEARCH_LENGTH;
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const activeOptionId =
    isOpen && activeIndex >= 0 && activeIndex < options.length
      ? optionId(activeIndex)
      : undefined;

  const selectActor = (option: AuditActorOption) => {
    focusTargetRef.current = 'clear';
    setSearch('');
    setIsOpen(false);
    setActiveIndex(-1);
    onChange({
      id: option.id,
      label: option.label,
      isSystem: option.isSystem,
    });
  };

  const clearActor = () => {
    focusTargetRef.current = 'input';
    setSearch('');
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(null);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!canSearch || options.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
          return;
        }
        setActiveIndex((index) =>
          index < 0 || index >= options.length - 1 ? 0 : index + 1,
        );
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(options.length - 1);
          return;
        }
        setActiveIndex((index) =>
          index <= 0 ? options.length - 1 : index - 1,
        );
        return;
      case 'Home':
        if (!isOpen) {
          return;
        }
        event.preventDefault();
        setActiveIndex(0);
        return;
      case 'End':
        if (!isOpen) {
          return;
        }
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      case 'Enter':
        if (!isOpen || activeIndex < 0 || activeIndex >= options.length) {
          return;
        }
        event.preventDefault();
        selectActor(options[activeIndex]);
        return;
      default:
        return;
    }
  };

  if (selection) {
    return (
      <div className="flex w-56 flex-col gap-1">
        <Text variant="caption" textColor="text-neutral-50">
          Actor
        </Text>
        <div className="flex h-12 items-center justify-between gap-2 rounded-full border border-neutral-90 px-4">
          <Text variant="body" textColor="text-neutral-20" className="truncate">
            {selection.label}
          </Text>
          <button
            ref={clearButtonRef}
            type="button"
            aria-label="Clear actor filter"
            onClick={clearActor}
            className="cursor-pointer rounded-full p-1 text-neutral-50 hover:bg-neutral-99 hover:text-neutral-20"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-56" ref={containerRef}>
      <Input
        ref={inputRef}
        label="Actor"
        placeholder="Search actors"
        value={search}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
        onFocus={() => setIsOpen(true)}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget as Node)) {
            setIsOpen(false);
            setActiveIndex(-1);
          }
        }}
        onChange={(event) => {
          setSearch(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-90 bg-white p-1 shadow-lg">
          <div
            id={listboxId}
            ref={listRef}
            role="listbox"
            aria-label="Actors"
            className="max-h-64 overflow-y-auto"
          >
            {!canSearch ? (
              <Text variant="caption" className="block px-3 py-2">
                Type at least {MIN_ACTOR_SEARCH_LENGTH} characters.
              </Text>
            ) : loading ? (
              <Text variant="caption" className="block px-3 py-2">
                Searching…
              </Text>
            ) : error ? (
              <Text
                variant="caption"
                textColor="text-red-700"
                className="block px-3 py-2"
              >
                Couldn&rsquo;t load actors.
              </Text>
            ) : options.length === 0 ? (
              <Text variant="caption" className="block px-3 py-2">
                No actors found.
              </Text>
            ) : (
              options.map((option, index) => (
                <button
                  id={optionId(index)}
                  key={option.id ?? 'system'}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectActor(option)}
                  className={mergeCss([
                    'block w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-neutral-20',
                    index === activeIndex
                      ? 'bg-neutral-99'
                      : 'hover:bg-neutral-99',
                  ])}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>

          {/* A failed lookup is not an empty one: offer the request again. */}
          {error && (
            <div className="border-t border-neutral-90 p-1">
              <Button
                variant="primary-sm"
                color="blue"
                className="w-full"
                onClick={() => {
                  void refetch();
                }}
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Date-range and actor filters for the audit log. Emits the derived
 * `dateFrom`/`dateTo`/`actorId`/`systemOnly` filter object on every change.
 *
 * All filter state belongs to the caller: it seeds the range from one clock
 * read, owns the actor selection, and can therefore reset both together when
 * the log's target changes. Only the range the user is currently looking at
 * stays local. The date props default to {@link DEFAULT_AUDIT_PRESET} for
 * standalone use.
 */
export function AuditFilterBar({
  targetType,
  objectId,
  onChange,
  actorSelection,
  onActorSelectionChange,
  initialPreset = DEFAULT_AUDIT_PRESET,
  initialRange,
}: {
  targetType: AuditTargetType;
  objectId: string;
  onChange: (filters: ObjectAuditLogFilters) => void;
  /** The committed actor filter, owned by the caller so it resets with the target. */
  actorSelection: AuditActorSelection | null;
  /** Emitted when the actor search commits or clears a selection. */
  onActorSelectionChange: (selection: AuditActorSelection | null) => void;
  /** Preset the caller seeded its filters with. */
  initialPreset?: DateRangePresetValue;
  /** Range the caller's filters represent; resolved from the preset if absent. */
  initialRange?: DateRange;
}) {
  const [preset, setPreset] = useState<DateRangePresetValue>(initialPreset);
  const [range, setRange] = useState<DateRange>(
    () => initialRange ?? resolvePresetValue(initialPreset),
  );

  const handleRangeChange = useCallback(
    (nextRange: DateRange, nextPreset: DateRangePresetValue) => {
      setRange(nextRange);
      setPreset(nextPreset);
      onChange(rangeToFilters(nextRange, actorSelection));
    },
    [actorSelection, onChange],
  );

  const handleActorChange = useCallback(
    (next: AuditActorSelection | null) => {
      onActorSelectionChange(next);
      // The range is already on screen; only the actor dimension moved.
      onChange(rangeToFilters(range, next));
    },
    [onChange, onActorSelectionChange, range],
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <DateRangeFilter
        includeAll
        presetAriaLabel="Date range"
        presetClassName="w-56"
        pickerClassName="w-80"
        value={range}
        preset={preset}
        onChange={handleRangeChange}
      />

      <ActorFilter
        targetType={targetType}
        objectId={objectId}
        selection={actorSelection}
        onChange={handleActorChange}
      />
    </div>
  );
}
