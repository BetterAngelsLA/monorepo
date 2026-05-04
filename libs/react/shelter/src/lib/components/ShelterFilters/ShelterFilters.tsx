import { useQuery } from '@apollo/client/react';
import { Checkbox, ExpandableContainer } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { TShelterPropertyFilters } from '../ShelterSearch';
import { FilterSelector } from './FilterSelector';
import { ShelterMaxStayDocument } from './__generated__/shelterMaxStay.generated';
import {
  demographicFilter,
  entryRequirementFilter,
  parkingFilter,
  petsFilter,
  referralRequirementFilter,
  roomStyleFilter,
  shelterTypeFilter,
  specialSituationFilter,
  TFilterConfig,
} from './config';

type IProps = {
  className?: string;
  filters: TShelterPropertyFilters;
  onFiltersChange: (filters: TShelterPropertyFilters) => void;
};

export function ShelterFilters(props: IProps) {
  const { className, filters, onFiltersChange } = props;

  const { data: maxStayData } = useQuery(ShelterMaxStayDocument);
  const maxStayMax = maxStayData?.shelterMaxStay ?? undefined;

  const parentCss = ['pb-24', className];

  function onFilterChange(
    filterName: TFilterConfig['name'],
    selected: string[]
  ) {
    onFiltersChange({
      ...filters,
      [filterName]: selected,
    });
  }

  function onOpenNowChange(checked: boolean) {
    onFiltersChange({
      ...filters,
      openNow: checked,
    });
  }

  function onIsAccessCenterChange(checked: boolean) {
    onFiltersChange({
      ...filters,
      isAccessCenter: checked,
    });
  }

  function onMaxStayDaysChange(days: string) {
    const parsed = parseInt(days, 10);
    onFiltersChange({
      ...filters,
      maxStay: {
        days: isNaN(parsed) ? 0 : parsed,
        includeNull: filters.maxStay?.includeNull ?? false,
      },
    });
  }

  function onMaxStayIncludeNullChange(checked: boolean) {
    onFiltersChange({
      ...filters,
      maxStay: {
        days: filters.maxStay?.days ?? 0,
        includeNull: checked,
      },
    });
  }

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
          values={filters[entryRequirementFilter.name]}
          {...entryRequirementFilter}
        />
        <FilterSelector
          className="mt-8"
          onChange={onFilterChange}
          values={filters[parkingFilter.name]}
          {...parkingFilter}
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
          values={filters[referralRequirementFilter.name]}
          {...referralRequirementFilter}
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
          values={filters[specialSituationFilter.name]}
          {...specialSituationFilter}
        />
        <FilterSelector
          className="mt-8"
          onChange={onFilterChange}
          values={filters[shelterTypeFilter.name]}
          {...shelterTypeFilter}
        />

        <div className="mt-8">
          <div className="flex justify-between items-center">Max Stay</div>
          <div className="mt-6 flex flex-col gap-2">
            <input
              type="number"
              min={1}
              max={maxStayMax}
              value={filters.maxStay?.days || ''}
              onChange={(e) => onMaxStayDaysChange(e.target.value)}
              placeholder={
                maxStayMax
                  ? `Enter number between 1 and ${maxStayMax}`
                  : 'Enter number'
              }
              className="w-full border border-neutral-90 rounded-lg px-3 py-2 text-sm bg-white"
            />
            <Checkbox
              className="w-full flex flex-row justify-end items-center gap-2 border-0 bg-white"
              label="Include unknown"
              disabled={!filters.maxStay?.days}
              checked={
                !!filters.maxStay?.includeNull &&
                (filters.maxStay?.days ?? 0) > 0
              }
              onChange={onMaxStayIncludeNullChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
