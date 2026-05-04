import {
  FilterChip,
  FilterDropdown,
  FilterSection,
} from '@monorepo/react/components';
import { useAtom } from 'jotai';
import { Filter, Search } from 'lucide-react';
import { useState } from 'react';
import {
  operatorShelterFiltersAtom,
  TOperatorShelterFilters,
} from '../../atoms/shelterFiltersAtom';
import { Button } from '../base-ui/buttons';
import { filterGroups } from './filterConfig';

export function ShelterFilterPanel() {
  const [filters, setFilters] = useAtom(operatorShelterFiltersAtom);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <FilterDropdown
      position="dropdown-end"
      title={
        <Button
          variant="primary"
          leftIcon={<Filter size={20} />}
          rightIcon={false}
        >
          Filter
        </Button>
      }
    >
      <div className="relative mb-3">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-warm-70"
        />
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-8 pr-3 py-1.5 rounded-full border border-neutral-90 text-xs outline-none text-neutral-warm-70"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filterGroups.map((group) => {
        const visibleOptions = normalizedSearch
          ? group.options.filter((opt) =>
              opt.label.toLowerCase().includes(normalizedSearch)
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
    </FilterDropdown>
  );
}
