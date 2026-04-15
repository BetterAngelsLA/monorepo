import { CloseIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { useSetAtom } from 'jotai';
import { shelterPropertyFiltersAtom } from '../../atoms';
import { TShelterPropertyFilters } from '../ShelterSearch';
import { getFilterLabel } from './config';

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

  if (!filters) {
    return null;
  }

  const pills: TPill[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (key === 'openNow') {
      if (value) {
        pills.push({
          id: 'openNow',
          label: 'Open now',
          clear: (prev) => ({ ...prev, openNow: false }),
        });
      }
      continue;
    }
    if (key === 'isAccessCenter') {
      if (value) {
        pills.push({
          id: 'isAccessCenter',
          label: 'Shelter is Access Center',
          clear: (prev) => ({ ...prev, isAccessCenter: false }),
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
              className="flex shrink-0 items-center justify-center rounded-full p-0.5 text-neutral-50 hover:bg-primary-90 hover:text-neutral-20"
              aria-label={`Remove ${pill.label} filter`}
              onClick={() => onClearPill(pill)}
            >
              <CloseIcon className="w-2.5 h-2.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
