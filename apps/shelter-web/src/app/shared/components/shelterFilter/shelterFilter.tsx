import { useEffect, useState } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { FilterSelector } from './filterSelector';
import {
  demographicFilter,
  parkingFilter,
  petsFilter,
  roomStyleFilter,
  shelterTypeFilter,
  specialSituationFilter,
} from './shelterFilter.config';

type IProps = {
  className?: string;
};

export function ShelterFilter(props: IProps) {
  const { className } = props;

  const filterValues = {
    [demographicFilter.name]: [],
    [parkingFilter.name]: [],
    [petsFilter.name]: [],
    [roomStyleFilter.name]: [],
    [shelterTypeFilter.name]: [],
    [specialSituationFilter.name]: [],
  };

  const [filters, setFilters] =
    useState<Record<string, string[]>>(filterValues);

  const parentCss = ['xborder', 'border-red-500', className];

  function onFilterChange(filterName: string, selected: string[]) {
    setFilters((prev) => {
      return {
        ...prev,
        [filterName]: selected,
      };
    });
  }

  useEffect(() => {
    console.log();
    console.log('| -------------  filters  ------------- |');
    console.log(filters);
    console.log();
  }, [filters]);

  return (
    <div className={mergeCss(parentCss)}>
      <div className="text-xl">Filter</div>
      <div>Select the categories below to filter shelters</div>

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
    </div>
  );
}
