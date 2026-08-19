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
import type { SortDirection } from '../base-ui/table';
import { Button } from '../base-ui/buttons';
import { filterGroups } from './filterConfig';

type SortableColumn = 'name' | 'capacity' | 'status';

interface SortState {
  column: SortableColumn;
  direction: Ordering;
}

interface ShelterFilterPanelProps {
  sort: SortState;
  onSortChange: (column: string | null, direction: SortDirection | null) => void;
}

const SORT_OPTIONS: {
  label: string;
  column: SortableColumn;
  direction: Ordering;
}[] = [
  { label: 'Name Ascending', column: 'name', direction: Ordering.Asc },
  { label: 'Name Descending', column: 'name', direction: Ordering.Desc },
  { label: 'Capacity Low to High', column: 'capacity', direction: Ordering.Asc },
  { label: 'Capacity High to Low', column: 'capacity', direction: Ordering.Desc },
];

interface DrawerContentProps {
  sort: SortState;
  onSortChange: (column: string | null, direction: SortDirection | null) => void;
}

function SortFilterDrawerContent({ sort, onSortChange }: DrawerContentProps) {
  const [filters, setFilters] = useAtom(operatorShelterFiltersAtom);

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
    <div className="flex flex-col gap-4">
      <FilterSection header="Sort">
        {SORT_OPTIONS.map((opt) => {
          const isActive =
            sort.column === opt.column && sort.direction === opt.direction;
          return (
            <FilterChip
              key={`${opt.column}-${opt.direction}`}
              label={opt.label}
              active={isActive}
              onClick={() =>
                onSortChange(
                  opt.column,
                  opt.direction === Ordering.Asc ? 'asc' : 'desc',
                )
              }
            />
          );
        })}
      </FilterSection>

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

export function ShelterFilterPanel({ sort, onSortChange }: ShelterFilterPanelProps) {
  const { showDrawer } = useAppDrawer();

  function openDrawer() {
    showDrawer({
      placement: 'right',
      header: 'Sort & Filter',
      content: (
        <SortFilterDrawerContent sort={sort} onSortChange={onSortChange} />
      ),
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
