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
 * own floor), and the caller only mounts this when the user holds
 * `view_org_members`, which the backend requires.
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
  const { options, loading } = useAuditActors({
    targetType,
    objectId,
    search: debouncedSearch,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

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
        label="Actor"
        placeholder="Search actors"
        value={search}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
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
        <div
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label="Actors"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-neutral-90 bg-white p-1 shadow-lg"
        >
          {!canSearch ? (
            <Text variant="caption" className="block px-3 py-2">
              Type at least {MIN_ACTOR_SEARCH_LENGTH} characters.
            </Text>
          ) : loading ? (
            <Text variant="caption" className="block px-3 py-2">
              Searching…
            </Text>
          ) : options.length === 0 ? (
            <Text variant="caption" className="block px-3 py-2">
              No actors found.
            </Text>
          ) : (
            options.map((option, index) => (
              <button
                id={optionId(index)}
                key={option.id}
                type="button"
                role="option"
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
      )}
    </div>
  );
}

/**
 * Date-range and actor filters for the audit log. Emits the derived
 * `dateFrom`/`dateTo`/`actorId`/`systemOnly` filter object on every change.
 *
 * The caller passes the preset and range it seeded its query with, so the bar
 * and the query come from one clock read. The props default to
 * {@link DEFAULT_AUDIT_PRESET} for standalone use.
 */
export function AuditFilterBar({
  targetType,
  objectId,
  onChange,
  initialPreset = DEFAULT_AUDIT_PRESET,
  initialRange,
}: {
  targetType: AuditTargetType;
  objectId: string;
  onChange: (filters: ObjectAuditLogFilters) => void;
  /** Preset the caller seeded its filters with. */
  initialPreset?: DateRangePresetValue;
  /** Range the caller's filters represent; resolved from the preset if absent. */
  initialRange?: DateRange;
}) {
  const [preset, setPreset] = useState<DateRangePresetValue>(initialPreset);
  const [range, setRange] = useState<DateRange>(
    () => initialRange ?? resolvePresetValue(initialPreset),
  );
  const [actorSelection, setActorSelection] =
    useState<AuditActorSelection | null>(null);

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
      setActorSelection(next);
      // The range is already on screen; only the actor dimension moved.
      onChange(rangeToFilters(range, next));
    },
    [range, onChange],
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
