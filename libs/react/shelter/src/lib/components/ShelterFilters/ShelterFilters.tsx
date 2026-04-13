import { Checkbox, ExpandableContainer } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { shelterPropertyFiltersAtom } from '../../atoms';
import { TShelterPropertyFilters } from '../ShelterSearch';
import { FilterSelector } from './FilterSelector';
import {
  demographicFilter,
  parkingFilter,
  petsFilter,
  roomStyleFilter,
  shelterTypeFilter,
  specialSituationFilter,
  TFilterConfig,
} from './config';

type IProps = {
  className?: string;
  onChange?: (filters: TShelterPropertyFilters) => void;
};

export function ShelterFilters(props: IProps) {
  const { onChange, className } = props;

  const [filters, setFilters] = useAtom(shelterPropertyFiltersAtom);

  const parentCss = ['pb-24', className];

  function onFilterChange(
    filterName: TFilterConfig['name'],
    selected: string[]
  ) {
    setFilters((prev) => {
      return {
        ...prev,
        [filterName]: selected,
      };
    });
  }

  function onOpenNowChange(checked: boolean) {
    setFilters((prev) => ({
      ...prev,
      openNow: checked,
    }));
  }

  function onIsAccessCenterChange(checked: boolean) {
    setFilters((prev) => ({
      ...prev,
      isAccessCenter: checked,
    }));
  }

  function onMaxStayDaysChange(days: string) {
    const parsed = parseInt(days, 10);
    setFilters((prev) => ({
      ...prev,
      maxStay: {
        days: isNaN(parsed) ? 0 : parsed,
        includeNull: prev.maxStay?.includeNull ?? false,
      },
    }));
  }

  function onMaxStayIncludeNullChange(checked: boolean) {
    setFilters((prev) => ({
      ...prev,
      maxStay: {
        days: prev.maxStay?.days ?? 0,
        includeNull: checked,
      },
    }));
  }

  useEffect(() => {
    onChange && onChange(filters);
  }, [filters, onChange]);

  return (
    <div className={mergeCss(parentCss)}>
      <div>
        <div className="text-xl font-semibold">Filter</div>
        <div className="text-sm mt-1 pr-8">
          Select the categories below to filter shelters
        </div>
      </div>
      <div>
        <div className="mt-8">
          <ExpandableContainer header="Access Center">
            <Checkbox
              label="Shelter is Access Center"
              checked={!!filters.isAccessCenter}
              onChange={onIsAccessCenterChange}
            />
          </ExpandableContainer>
        </div>
        <div className="mt-8">
          <ExpandableContainer header="Availability">
            <Checkbox
              label="Open now"
              checked={!!filters.openNow}
              onChange={onOpenNowChange}
            />
          </ExpandableContainer>
        </div>

        <FilterSelector
          className="mt-8"
          onChange={onFilterChange}
          values={filters[demographicFilter.name]}
          {...demographicFilter}
        />

        <FilterSelector
          className="mt-8"
          onChange={onFilterChange}
          values={filters[specialSituationFilter.name]}
          {...specialSituationFilter}
        />

        <FilterSelector
          className="mt-8"
          onChange={onFilterChange}
          values={filters[shelterTypeFilter.name]}
          {...shelterTypeFilter}
        />

        <FilterSelector
          className="mt-8"
          onChange={onFilterChange}
          values={filters[roomStyleFilter.name]}
          {...roomStyleFilter}
        />

        <FilterSelector
          className="mt-8"
          onChange={onFilterChange}
          values={filters[petsFilter.name]}
          {...petsFilter}
        />

        <FilterSelector
          className="mt-8"
          onChange={onFilterChange}
          values={filters[parkingFilter.name]}
          {...parkingFilter}
        />

        <div className="mt-8">
          <div className="flex justify-between items-center">Max Stay</div>
          <div className="mt-6 flex flex-col gap-2">
            <input
              type="number"
              min={0}
              value={filters.maxStay?.days ?? ''}
              onChange={(e) => onMaxStayDaysChange(e.target.value)}
              placeholder="Max days"
              className="w-full border border-neutral-90 rounded-lg px-4 py-2 text-sm bg-white"
            />
            <Checkbox
              label="Include shelters with no max stay"
              checked={!!filters.maxStay?.includeNull}
              onChange={onMaxStayIncludeNullChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
