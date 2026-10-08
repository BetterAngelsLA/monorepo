import { useActiveOrg } from '@monorepo/ba-platform';
import { UserOrganizationPermissions } from '@monorepo/ba-platform/permissions';
import { endOfDay, startOfDay } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import type { ObjectAuditLogFilters } from '../../hooks';
import { useAuditActors } from '../../hooks';
import { Button } from '../base-ui/buttons';
import { Dropdown, type DropdownOption } from '../base-ui/dropdown';
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
  const { options: actorOptions } = useAuditActors();

  const [preset, setPreset] = useState<AuditDatePreset>('ALL');
  const [range, setRange] = useState<DateRangeValue>({ from: null, to: null });
  const [actorId, setActorId] = useState<string | null>(null);
  const [draftRange, setDraftRange] = useState<{
    from: Date | undefined;
    to?: Date | undefined;
  }>({ from: undefined });
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const presetValue = useMemo(
    () => DATE_PRESET_OPTIONS.find((option) => option.value === preset) ?? null,
    [preset],
  );

  const actorDropdownOptions = useMemo<DropdownOption<string>[]>(
    () =>
      actorOptions.map((actor) => ({ label: actor.label, value: actor.id })),
    [actorOptions],
  );

  const actorValue = useMemo<DropdownOption<string> | null>(() => {
    if (!actorId) {
      return null;
    }
    const match = actorDropdownOptions.find(
      (option) => option.value === actorId,
    );

    return match ?? null;
  }, [actorId, actorDropdownOptions]);

  const handlePresetChange = useCallback(
    (option: DropdownOption<AuditDatePreset> | null) => {
      const next = option?.value ?? 'ALL';

      if (next === 'CUSTOM') {
        setDraftRange({
          from: range.from ?? undefined,
          to: range.to ?? undefined,
        });
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
    (option: DropdownOption<string> | null) => {
      const nextActorId = option?.value ?? null;
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
        <div className="w-56">
          <Dropdown
            label="Actor"
            placeholder="All actors"
            isSearchable
            options={actorDropdownOptions}
            value={actorValue}
            onChange={handleActorChange}
          />
        </div>
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
