import { Ordering } from '@monorepo/ba-platform/types';
import {
  FilterChip,
  FilterSection,
  useAppDrawer,
} from '@monorepo/react/components';
import { useAtom } from 'jotai';
import { Filter } from 'lucide-react';
import {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-gray-700">Sort</span>
        <Dropdown
          options={SORT_OPTIONS}
          value={sortValue}
          onChange={handleSortChange}
          placeholder="Select sort order"
        />
      </div>

      {filterGroups.map((group) => {
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
            {group.options.map((opt) => (
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
