import { FilterSection } from '@monorepo/react/components';
import { useAtom } from 'jotai';
import {
  operatorShelterFiltersAtom,
  TOperatorShelterFilters,
} from '../../atoms/shelterFiltersAtom';
import { Dropdown } from '../base-ui/dropdown/Dropdown';
import type { DropdownOption } from '../base-ui/dropdown/types';
import { FilterOption, headerMatches } from './filterSearch';

type ArrayFilterKey = {
  [K in keyof TOperatorShelterFilters]: TOperatorShelterFilters[K] extends string[]
    ? K
    : never;
}[keyof TOperatorShelterFilters];

type MultiSelectFilterSectionProps = {
  header: string;
  filterKey: ArrayFilterKey;
  options: FilterOption[];
  placeholder: string;
  search: string;
  searchTerms?: string[];
  minOptions?: number;
};

export function MultiSelectFilterSection({
  header,
  filterKey,
  options,
  placeholder,
  search,
  searchTerms,
  minOptions = 1,
}: MultiSelectFilterSectionProps) {
  const [filters, setFilters] = useAtom(operatorShelterFiltersAtom);

  if (!headerMatches(header, search, searchTerms)) return null;
  if (options.length < minOptions) return null;

  const selectedIds = filters[filterKey];
  const dropdownOptions: DropdownOption<string>[] = options.map((o) => ({
    label: o.label,
    value: o.id,
  }));
  const value: DropdownOption<string>[] | null =
    selectedIds.length > 0
      ? options
          .filter((o) => selectedIds.includes(o.id))
          .map((o) => ({ label: o.label, value: o.id }))
      : null;

  return (
    <FilterSection
      header={header}
      onClear={
        selectedIds.length > 0
          ? () => setFilters((prev) => ({ ...prev, [filterKey]: [] }))
          : undefined
      }
    >
      <Dropdown
        isMulti
        isSearchable
        placeholder={placeholder}
        options={dropdownOptions}
        value={value}
        onChange={(selected) => {
          setFilters((prev) => ({
            ...prev,
            [filterKey]: selected ? selected.map((o) => o.value) : [],
          }));
        }}
      />
    </FilterSection>
  );
}
