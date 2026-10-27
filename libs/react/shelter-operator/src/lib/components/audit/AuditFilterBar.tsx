import { useActiveOrg } from '@monorepo/ba-platform';
import { UserOrganizationPermissions } from '@monorepo/ba-platform/permissions';
import { mergeCss, useDebounce } from '@monorepo/react/shared';
import { endOfDay, startOfDay } from 'date-fns';
import { X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { AuditActorOption, ObjectAuditLogFilters } from '../../hooks';
import { MIN_ACTOR_SEARCH_LENGTH, useAuditActors } from '../../hooks';
import { Dropdown, type DropdownOption } from '../base-ui/dropdown';
import { Input } from '../base-ui/input';
import { Text } from '../base-ui/text/text';
import {
  DateRangePicker,
  PRESET_LABELS,
  resolvePreset,
  type DateRange,
  type DateRangePreset,
} from '../date-range-filter';

type AuditDatePreset = 'ALL' | DateRangePreset;

const DATE_PRESET_OPTIONS: ReadonlyArray<DropdownOption<AuditDatePreset>> = [
  { value: 'ALL', label: 'All time' },
  ...(Object.entries(PRESET_LABELS) as Array<[DateRangePreset, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
];

/** How long to wait after the last keystroke before querying actors. */
const ACTOR_SEARCH_DEBOUNCE_MS = 300;

function rangeToFilters(
  range: DateRange,
  actorId: string | null,
): ObjectAuditLogFilters {
  return {
    dateFrom: range.from ? startOfDay(range.from).toISOString() : null,
    dateTo: range.to ? endOfDay(range.to).toISOString() : null,
    actorId,
  };
}

/**
 * Actor filter: an on-demand, debounced search over organization members.
 *
 * Nothing is requested until the term is at least two characters (the backend's
 * own floor), and the caller only mounts this when the user holds
 * `view_org_members`, which the backend requires.
 */
function ActorFilter({
  actorId,
  onChange,
}: {
  actorId: string | null;
  onChange: (actorId: string | null) => void;
}) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, ACTOR_SEARCH_DEBOUNCE_MS);
  const { options, loading } = useAuditActors({ search: debouncedSearch });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
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
    setSelectedLabel(option.label);
    setSearch('');
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(option.id);
  };

  const clearActor = () => {
    setSelectedLabel(null);
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

  if (actorId) {
    return (
      <div className="flex w-56 flex-col gap-1">
        <Text variant="caption" textColor="text-neutral-50">
          Actor
        </Text>
        <div className="flex h-12 items-center justify-between gap-2 rounded-full border border-neutral-90 px-4">
          <Text variant="body" textColor="text-neutral-20" className="truncate">
            {selectedLabel ?? 'Selected actor'}
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
 * `dateFrom`/`dateTo`/`actorId` filter object on every change.
 */
export function AuditFilterBar({
  onChange,
}: {
  onChange: (filters: ObjectAuditLogFilters) => void;
}) {
  const { hasPermission } = useActiveOrg();
  const canViewActors = hasPermission(
    UserOrganizationPermissions.ViewOrgMembers,
  );

  const [preset, setPreset] = useState<AuditDatePreset>('ALL');
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [previewCustom, setPreviewCustom] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [actorId, setActorId] = useState<string | null>(null);

  const presetValue = useMemo(() => {
    const value = previewCustom ? 'CUSTOM' : preset;

    return DATE_PRESET_OPTIONS.find((option) => option.value === value) ?? null;
  }, [preset, previewCustom]);

  const handlePresetChange = useCallback(
    (option: DropdownOption<AuditDatePreset> | null) => {
      const next = option?.value ?? 'ALL';

      if (next === 'CUSTOM') {
        setPreviewCustom(true);
        setIsPickerOpen(true);
        return;
      }

      const nextRange: DateRange =
        next === 'ALL' ? { from: null, to: null } : resolvePreset(next);

      setPreset(next);
      setPreviewCustom(false);
      setRange(nextRange);
      setIsPickerOpen(false);
      onChange(rangeToFilters(nextRange, actorId));
    },
    [actorId, onChange],
  );

  const handlePickerOpenChange = useCallback((isOpen: boolean) => {
    setIsPickerOpen(isOpen);
    if (!isOpen) {
      setPreviewCustom(false);
    }
  }, []);

  const handlePickerCommit = useCallback(
    (next: DateRange) => {
      setPreset('CUSTOM');
      setPreviewCustom(false);
      setRange(next);
      setIsPickerOpen(false);
      onChange(rangeToFilters(next, actorId));
    },
    [actorId, onChange],
  );

  const handleActorChange = useCallback(
    (nextActorId: string | null) => {
      setActorId(nextActorId);
      onChange(rangeToFilters(range, nextActorId));
    },
    [range, onChange],
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-56">
        <Dropdown
          label="Date range"
          options={DATE_PRESET_OPTIONS}
          value={presetValue}
          onChange={handlePresetChange}
        />
      </div>

      <DateRangePicker
        className="w-80"
        value={range}
        open={isPickerOpen}
        onOpenChange={handlePickerOpenChange}
        onDirty={() => setPreviewCustom(true)}
        onCommit={handlePickerCommit}
      />

      {canViewActors && (
        <ActorFilter actorId={actorId} onChange={handleActorChange} />
      )}
    </div>
  );
}
