import { useQuery } from '@apollo/client/react';
import { Checkbox, ExpandableContainer } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useEffect, useState } from 'react';
import { ScheduleTypeChoices } from '../../apollo';
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

const OPEN_NOW_OPTIONS: {
  key: ScheduleTypeChoices;
  label: string;
}[] = [
  { key: ScheduleTypeChoices.Operating, label: 'Operating Hours' },
  { key: ScheduleTypeChoices.Intake, label: 'Intake' },
  { key: ScheduleTypeChoices.MealService, label: 'Meal Services' },
  { key: ScheduleTypeChoices.StaffAvailability, label: 'Staff Availability' },
];

const HIGH_PRIORITY_FILTERS = [
  demographicFilter,
  entryRequirementFilter,
  parkingFilter,
  petsFilter,
  referralRequirementFilter,
];

const LOW_PRIORITY_FILTERS = [
  roomStyleFilter,
  shelterTypeFilter,
  specialSituationFilter,
];

export function ShelterFilters(props: IProps) {
  const { className, filters, onFiltersChange } = props;

  const { data: maxStayData } = useQuery(ShelterMaxStayDocument);
  const maxStayMax = maxStayData?.shelterMaxStay ?? undefined;

  const initialOpenNowTypes = filters.openNowScheduleTypes ?? [];

  const [openNowTypes, setOpenNowTypes] =
    useState<ScheduleTypeChoices[]>(initialOpenNowTypes);

  const [showMoreCategories, setShowMoreCategories] = useState(false);

  useEffect(() => {
    setOpenNowTypes(filters.openNowScheduleTypes ?? []);
  }, [filters.openNowScheduleTypes]);

  const parentCss = ['pb-24', className];

  function onFilterChange(
    filterName: TFilterConfig['name'],
    selected: string[],
  ) {
    onFiltersChange({
      ...filters,
      [filterName]: selected,
    });
  }

  function onOpenNowScheduleTypeChange(
    scheduleType: ScheduleTypeChoices,
    checked: boolean,
  ) {
    const newTypes = checked
      ? [...openNowTypes, scheduleType]
      : openNowTypes.filter((t) => t !== scheduleType);

    setOpenNowTypes(newTypes);

    onFiltersChange({
      ...filters,
      openNow: newTypes.length > 0 ? true : undefined,
      openNowScheduleTypes: newTypes.length > 0 ? newTypes : undefined,
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

  function renderFilterSelector(filter: TFilterConfig) {
    return (
      <FilterSelector
        key={filter.name}
        className="mt-8"
        onChange={onFilterChange}
        values={filters[filter.name]}
        {...filter}
      />
    );
  }

  return (
    <div className={mergeCss(parentCss)}>
      <div>
        <div className="text-xl font-semibold">Filter</div>

        <div className="mt-1 pr-8 text-sm">
          Select the categories below to filter shelters
        </div>
      </div>

      <div>
        {/* High priority 1 */}
        <div className="mt-8">
          <ExpandableContainer header="Access Center">
            <Checkbox
              label="Shelter is Access Center"
              checked={!!filters.isAccessCenter}
              onChange={onIsAccessCenterChange}
            />
          </ExpandableContainer>
        </div>

        {/* High priority 2 */}
        <div className="mt-8">
          <ExpandableContainer header="Open Now">
            <div className="flex flex-col gap-2">
              {OPEN_NOW_OPTIONS.map((option) => (
                <Checkbox
                  key={option.key}
                  label={option.label}
                  checked={openNowTypes.includes(option.key)}
                  onChange={(checked) =>
                    onOpenNowScheduleTypeChange(option.key, checked)
                  }
                />
              ))}
            </div>
          </ExpandableContainer>
        </div>

        {/* High priority 3–7 */}
        {HIGH_PRIORITY_FILTERS.map(renderFilterSelector)}

        {/* Low-priority categories */}
        {showMoreCategories && (
          <>
            {/* Alphabetically first low-priority category */}
            <div className="mt-8">
              <div className="flex items-center justify-between">Max Stay</div>

              <div className="mt-6 flex flex-col gap-2">
                <input
                  type="number"
                  min={1}
                  max={maxStayMax}
                  value={filters.maxStay?.days || ''}
                  onChange={(event) => onMaxStayDaysChange(event.target.value)}
                  placeholder={
                    maxStayMax
                      ? `Enter number between 1 and ${maxStayMax}`
                      : 'Enter number'
                  }
                  className="w-full rounded-lg border border-neutral-90 bg-white px-3 py-2 text-sm"
                />

                <Checkbox
                  className="flex w-full flex-row items-center justify-end gap-2 border-0 bg-white"
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

            {LOW_PRIORITY_FILTERS.map(renderFilterSelector)}
          </>
        )}

        <button
          type="button"
          className="mt-8 flex w-full items-center justify-end gap-3 font-semibold text-primary-60"
          aria-expanded={showMoreCategories}
          aria-controls="low-priority-shelter-filters"
          onClick={() => setShowMoreCategories((current) => !current)}
        >
          <span>
            {showMoreCategories
              ? 'Show Less Categories'
              : 'Show More Categories'}
          </span>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className={mergeCss([
              'h-5 w-5 transition-transform duration-200',
              showMoreCategories ? 'rotate-180' : '',
            ])}
          >
            <path
              d="M4 7.5 10 13l6-5.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
