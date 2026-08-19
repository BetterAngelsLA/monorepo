import { Ordering } from '@monorepo/ba-platform/types';
import {
  FilterChip,
  FilterSection,
  useAppDrawer,
} from '@monorepo/react/components';
import { useAtom } from 'jotai';
import { Filter, Search } from 'lucide-react';
import { useState } from 'react';
import {
  nullOperatorShelterFilters,
  operatorShelterFiltersAtom,
  TOperatorShelterFilters,
} from '../../atoms/shelterFiltersAtom';
import {
  DEFAULT_SHELTER_SORT,
  operatorShelterSortAtom,
} from '../../atoms/shelterSortAtom';
import { Button } from '../base-ui/buttons';
import { Dropdown } from '../base-ui/dropdown/Dropdown';
import type { DropdownOption } from '../base-ui/dropdown/types';
import { filterGroups } from './filterConfig';

const SORT_OPTIONS: DropdownOption<string>[] = [
  { label: 'Name: Ascending', value: 'name-asc' },
  { label: 'Name: Descending', value: 'name-desc' },
  { label: 'Capacity: Low to High', value: 'capacity-asc' },
  { label: 'Capacity: High to Low', value: 'capacity-desc' },
];

function SortFilterDrawerContent() {
  const [sort, setSort] = useAtom(operatorShelterSortAtom);
  const [filters, setFilters] = useAtom(operatorShelterFiltersAtom);
  const [searchTerm, setSearchTerm] = useState('');
  const sortValue =
    SORT_OPTIONS.find(
      (o) =>
        o.value ===
        `${sort.column}-${sort.direction === Ordering.Asc ? 'asc' : 'desc'}`,
    ) ?? null;

  function handleSortChange(opt: DropdownOption<string> | null) {
    if (!opt) {
      setSort(DEFAULT_SHELTER_SORT);
      return;
    }
    const [column, dir] = opt.value.split('-');
    setSort({
      column: column as typeof sort.column,
      direction: dir === 'asc' ? Ordering.Asc : Ordering.Desc,
    });
  }

  function toggleValue(group: string, value: string) {
    setFilters((prev: TOperatorShelterFilters) => {
      const current = prev[group as keyof TOperatorShelterFilters] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [group]: next };
    });
  }

  function clearGroup(group: string) {
    setFilters((prev: TOperatorShelterFilters) => ({
      ...prev,
      [group]: [],
    }));
  }
  const normalizedSearch = searchTerm.toLowerCase().trim();
  const hasActiveFilters = Object.values(filters).some((v) => v.length > 0);

  function clearAllFilters() {
    setFilters(nullOperatorShelterFilters);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-700">Sort</span>
        <Dropdown
          options={SORT_OPTIONS}
          value={sortValue}
          onChange={handleSortChange}
          placeholder="Select sort order"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Filter</span>
        {hasActiveFilters && (
          <button
          type="button"
          onClick={clearAllFilters}
          className="inline-flex items-center gap-0.5 text-[12px] text-neutral-warm-70 cursor-pointer"
          >
          Clear all
        </button>
        )}
      </div>
      <div className="relative mb-1">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-warm-70"
        />
        <input
          type="text"
          placeholder="Search filters"
          className="w-full pl-8 pr-3 py-1.5 rounded-full border border-neutral-90 text-xs outline-none text-neutral-warm-70"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filterGroups.map((group) => {
        const headerMatches =
          normalizedSearch &&
          group.header.toLowerCase().includes(normalizedSearch);
        const visibleOptions = normalizedSearch
          ? headerMatches
            ? group.options
            : group.options.filter((opt) =>
                opt.label.toLowerCase().includes(normalizedSearch),
              )
          : group.options;

        if (normalizedSearch && visibleOptions.length === 0) return null;
        const groupValues =
          filters[group.name as keyof TOperatorShelterFilters] ?? [];

        return (
          <FilterSection
            key={group.name}
            header={group.header}
            onClear={
              groupValues.length > 0 ? () => clearGroup(group.name) : undefined
            }
          >
            {visibleOptions.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={groupValues.includes(opt.value)}
                activeClassName={group.activeClassName}
                onClick={() => toggleValue(group.name, opt.value)}
              />
            ))}
          </FilterSection>
        );
      })}
    </div>
  );
}

export function ShelterFilterPanel() {
  const { showDrawer } = useAppDrawer();

  function openDrawer() {
    showDrawer({
      placement: 'right',
      header: 'Sort & Filter',
      content: <SortFilterDrawerContent />,
    });
  }

  return (
    <Button
      variant="primary"
      leftIcon={<Filter size={20} />}
      rightIcon={false}
      onClick={openDrawer}
    >
      Sort & Filter
    </Button>
  );
}
