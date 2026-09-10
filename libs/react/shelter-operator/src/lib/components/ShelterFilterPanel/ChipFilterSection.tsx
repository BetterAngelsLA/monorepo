import { FilterChip, FilterSection } from '@monorepo/react/components';
import { useAtom } from 'jotai';
import {
  operatorShelterFiltersAtom,
  TOperatorShelterFilters,
} from '../../atoms/shelterFiltersAtom';
import { FilterOption, getVisibleOptions } from './filterSearch';

type ArrayFilterKey = {
  [K in keyof TOperatorShelterFilters]: TOperatorShelterFilters[K] extends string[]
    ? K
    : never;
}[keyof TOperatorShelterFilters];

type ChipFilterSectionProps = {
  header: string;
  filterKey: ArrayFilterKey;
  options: FilterOption[];
  activeClassName: string;
  search: string;
};

export function ChipFilterSection({
  header,
  filterKey,
  options,
  activeClassName,
  search,
}: ChipFilterSectionProps) {
  const [filters, setFilters] = useAtom(operatorShelterFiltersAtom);
  const visible = getVisibleOptions(header, options, search);
  if (!visible) return null;

  const selected = filters[filterKey];

  function toggleValue(value: string) {
    setFilters((prev) => {
      const current = prev[filterKey];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [filterKey]: next };
    });
  }

  return (
    <FilterSection
      header={header}
      onClear={
        selected.length > 0
          ? () => setFilters((prev) => ({ ...prev, [filterKey]: [] }))
          : undefined
      }
    >
      {visible.map((opt) => (
        <FilterChip
          key={opt.id}
          label={opt.label}
          active={selected.includes(opt.id)}
          activeClassName={activeClassName}
          onClick={() => toggleValue(opt.id)}
        />
      ))}
    </FilterSection>
  );
}
