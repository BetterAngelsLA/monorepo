import { CloseIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { useSetAtom } from 'jotai';
import { ScheduleTypeChoices } from '../../apollo';
import {
  shelterPropertyFiltersAtom,
  shelterSearchTriggerAtom,
} from '../../atoms';
import { TShelterPropertyFilters } from '../ShelterSearch';
import { getFilterLabel } from './config';

const OPEN_NOW_SCHEDULE_TYPE_LABELS: Record<ScheduleTypeChoices, string> = {
  [ScheduleTypeChoices.Operating]: 'Operating Hours',
  [ScheduleTypeChoices.Intake]: 'Intake',
  [ScheduleTypeChoices.MealService]: 'Meal Services',
  [ScheduleTypeChoices.StaffAvailability]: 'Staff Availability',
};

type TArrayFilterKey = keyof Pick<
  TShelterPropertyFilters,
  | 'demographics'
  | 'parking'
  | 'pets'
  | 'roomStyles'
  | 'shelterTypes'
  | 'specialSituationRestrictions'
>;

type TPill = {
  id: string;
  label: string;
  clear: (prev: TShelterPropertyFilters) => TShelterPropertyFilters;
};

type IProps = {
  className?: string;
  filters: TShelterPropertyFilters;
  /** Keep applied search variables in sync when a pill is cleared (e.g. `setQueryFilters` in ShelterSearch). */
  onPillClear?: (next: TShelterPropertyFilters) => void;
};

export function FilterPills(props: IProps) {
  const { className, filters, onPillClear } = props;
  const setFilters = useSetAtom(shelterPropertyFiltersAtom);
  const setSearchTrigger = useSetAtom(shelterSearchTriggerAtom);

  if (!filters) {
    return null;
  }

  const pills: TPill[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (key === 'openNow') {
      continue;
    }
    if (key === 'openNowScheduleTypes') {
      const scheduleTypes = value as ScheduleTypeChoices[] | undefined;
      scheduleTypes?.forEach((scheduleType) => {
        const label = OPEN_NOW_SCHEDULE_TYPE_LABELS[scheduleType];
        if (label) {
          pills.push({
            id: `openNowScheduleTypes-${scheduleType}`,
            label,
            clear: (prev) => {
              const nextTypes = (prev.openNowScheduleTypes ?? []).filter(
                (t) => t !== scheduleType
              );
              return {
                ...prev,
                openNowScheduleTypes:
                  nextTypes.length > 0 ? nextTypes : undefined,
                openNow: nextTypes.length > 0 ? true : undefined,
              };
            },
          });
        }
      });
      continue;
    }
    if (key === 'openNowIncludeNull') {
      if (value) {
        pills.push({
          id: 'openNowIncludeNull',
          label: 'Open now: Include unknown',
          clear: (prev) => ({
            ...prev,
            openNowIncludeNull: undefined,
            openNow:
              (prev.openNowScheduleTypes ?? []).length > 0 ? true : undefined,
          }),
        });
      }
      continue;
    }
    if (key === 'isAccessCenter') {
      if (value) {
        pills.push({
          id: 'isAccessCenter',
          label: 'Shelter is Access Center',
          clear: (prev) => ({ ...prev, isAccessCenter: undefined }),
        });
      }
      continue;
    }
    if (key === 'maxStay') {
      const maxStay = value as TShelterPropertyFilters['maxStay'];
      if (maxStay) {
        pills.push({
          id: 'maxStay',
          label: `Max stay: ${maxStay.days} days`,
          clear: (prev) => ({ ...prev, maxStay: undefined }),
        });
      }
      continue;
    }

    (value as string[] | undefined)?.forEach((val) => {
      const label = getFilterLabel(
        key as keyof TShelterPropertyFilters,
        val as never
      );

      if (label) {
        const arrayKey = key as TArrayFilterKey;
        pills.push({
          id: `${key}-${val}`,
          label,
          clear: (prev) => ({
            ...prev,
            [arrayKey]: (prev[arrayKey] ?? []).filter((v) => v !== val),
          }),
        });
      }
    });
  }

  const parentCss = ['flex', 'flex-wrap', className];

  const labelCss = [
    'inline-flex',
    'items-center',
    'gap-1',
    'mr-2',
    'last:mr-0',
    'pl-2',
    'pr-1',
    'py-1',
    'text-xs',
    'bg-primary-95',
    'rounded',
    'mb-2',
  ];

  function onClearPill(pill: TPill) {
    const next = pill.clear(filters);
    setFilters(next);
    setSearchTrigger((n) => n + 1);
    onPillClear?.(next);
  }

  return (
    <div className={mergeCss(parentCss)}>
      {pills.map((pill) => {
        return (
          <div className={mergeCss(labelCss)} key={pill.id}>
            <span>{pill.label}</span>
            <button
              type="button"
              className="
    group
    flex shrink-0 items-center justify-center
    rounded-full p-1
  "
              aria-label={`Remove ${pill.label} filter`}
              onClick={() => onClearPill(pill)}
            >
              <CloseIcon
                className="
      w-3 h-3
      bg-white-60
      rounded-full
      p-0.5
      text-primary-20
      group-active:text-[#E8ECF2]
    "
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
