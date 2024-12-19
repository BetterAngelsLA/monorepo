import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { shelterFiltersAtom } from '../../atoms/shelterFiltersAtom';
import { mergeCss } from '../../utils/styles/mergeCss';
import { TShelterPropertyFilters } from '../shelters/sheltersDisplay';
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
  onChange?: (filters: TShelterPropertyFilters) => void;
};

export function ShelterFilters(props: IProps) {
  const { onChange, className } = props;

  const [filters, setFilters] = useAtom(shelterFiltersAtom);

  const parentCss = [className];

  function onFilterChange(filterName: string, selected: string[]) {
    setFilters((prev) => {
      return {
        ...prev,
        [filterName]: selected,
      };
    });
  }

  useEffect(() => {
    onChange && onChange(filters);
  }, [filters]);

  const hello = filters[demographicFilter.name];

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
