import { useActiveOrg } from '@monorepo/ba-platform';
import { UserOrganizationPermissions } from '@monorepo/ba-platform/permissions';
import { useDebounce } from '@monorepo/react/shared';
import { endOfDay, startOfDay } from 'date-fns';
import { X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AuditActorOption, ObjectAuditLogFilters } from '../../hooks';
import { MIN_ACTOR_SEARCH_LENGTH, useAuditActors } from '../../hooks';
import { Button } from '../base-ui/buttons';
import { Dropdown, type DropdownOption } from '../base-ui/dropdown';
import { Input } from '../base-ui/input';
import { Modal } from '../base-ui/modal';
import { Text } from '../base-ui/text/text';
import { Calendar, resolvePreset } from '../date-range-filter';

type AuditDatePreset =
  | 'ALL'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'MONTH_TO_DATE'
  | 'YEAR_TO_DATE'
  | 'CUSTOM';

const DATE_PRESET_OPTIONS: ReadonlyArray<DropdownOption<AuditDatePreset>> = [
  { value: 'ALL', label: 'All time' },
  { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 days' },
  { value: 'MONTH_TO_DATE', label: 'Month to date' },
  { value: 'YEAR_TO_DATE', label: 'Year to date' },
  { value: 'CUSTOM', label: 'Custom range' },
];

/** How long to wait after the last keystroke before querying actors. */
const ACTOR_SEARCH_DEBOUNCE_MS = 300;

type DateRangeValue = { from: Date | null; to: Date | null };

function toFilters(
  preset: AuditDatePreset,
  range: DateRangeValue,
  actorId: string | null,
): ObjectAuditLogFilters {
  const boundsFor = (
    from: Date | null,
    to: Date | null,
  ): ObjectAuditLogFilters => ({
    dateFrom: from ? startOfDay(from).toISOString() : null,
    dateTo: to ? endOfDay(to).toISOString() : null,
    actorId,
  });

  if (preset === 'ALL') {
    return { dateFrom: null, dateTo: null, actorId };
  }
  if (preset === 'CUSTOM') {
    return boundsFor(range.from, range.to);
  }

  const resolved = resolvePreset(preset);

  return boundsFor(resolved.from, resolved.to);
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
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const term = debouncedSearch.trim();
  const canSearch = term.length >= MIN_ACTOR_SEARCH_LENGTH;

  const selectActor = (option: AuditActorOption) => {
    setSelectedLabel(option.label);
    setSearch('');
    setIsOpen(false);
    onChange(option.id);
  };

  const clearActor = () => {
    setSelectedLabel(null);
    setSearch('');
    setIsOpen(false);
    onChange(null);
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
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onFocus={() => setIsOpen(true)}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget as Node)) {
            setIsOpen(false);
          }
        }}
        onChange={(event) => {
          setSearch(event.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      />

      {isOpen && (
        <div
          id={listboxId}
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
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectActor(option)}
                className="block w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-neutral-20 hover:bg-neutral-99"
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
  const [range, setRange] = useState<DateRangeValue>({ from: null, to: null });
  const [actorId, setActorId] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(() => new Date());
  const [draftRange, setDraftRange] = useState<{
    from: Date | undefined;
    to?: Date | undefined;
  }>({ from: undefined });
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const presetValue = useMemo(
    () => DATE_PRESET_OPTIONS.find((option) => option.value === preset) ?? null,
    [preset],
  );

  const handlePresetChange = useCallback(
    (option: DropdownOption<AuditDatePreset> | null) => {
      const next = option?.value ?? 'ALL';

      if (next === 'CUSTOM') {
        const customRange = {
          from: range.from ?? undefined,
          to: range.to ?? undefined,
        };
        setDraftRange(customRange);
        setMonth(customRange.from ?? new Date());
        setIsCustomOpen(true);
        return;
      }

      let nextRange: DateRangeValue = { from: null, to: null };
      if (next !== 'ALL') {
        const resolved = resolvePreset(next);
        nextRange = { from: resolved.from, to: resolved.to };
      }

      setPreset(next);
      setRange(nextRange);
      onChange(toFilters(next, nextRange, actorId));
    },
    [range.from, range.to, actorId, onChange],
  );

  const handleActorChange = useCallback(
    (nextActorId: string | null) => {
      setActorId(nextActorId);
      onChange(toFilters(preset, range, nextActorId));
    },
    [preset, range, onChange],
  );

  const handleApplyCustom = useCallback(() => {
    const nextRange: DateRangeValue = {
      from: draftRange.from ?? null,
      to: draftRange.to ?? null,
    };
    setPreset('CUSTOM');
    setRange(nextRange);
    setMonth(nextRange.from ?? new Date());
    setIsCustomOpen(false);
    onChange(toFilters('CUSTOM', nextRange, actorId));
  }, [draftRange, actorId, onChange]);

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

      {canViewActors && (
        <ActorFilter actorId={actorId} onChange={handleActorChange} />
      )}

      <Modal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
        size="lg"
      >
        <div className="flex flex-col gap-4 p-6">
          <Text variant="subheading" textColor="text-neutral-20">
            Custom range
          </Text>

          <Calendar
            selected={draftRange}
            month={month}
            onMonthChange={setMonth}
            onSelect={(next) =>
              setDraftRange({ from: next?.from, to: next?.to })
            }
          />

          <div className="flex justify-end gap-2">
            <Button variant="primary" onClick={() => setIsCustomOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" color="blue" onClick={handleApplyCustom}>
              Apply
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
