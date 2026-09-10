import { FilterChip, FilterSection } from '@monorepo/react/components';
import { useAtom } from 'jotai';
import {
  operatorShelterFiltersAtom,
  TOperatorShelterFilters,
} from '../../atoms/shelterFiltersAtom';
import { headerMatches } from './filterSearch';

type BooleanFilterKey = {
  [K in keyof TOperatorShelterFilters]: TOperatorShelterFilters[K] extends string[]
    ? K
    : never;
}[keyof TOperatorShelterFilters];

type BooleanFilterSectionProps = {
  header: string;
  filterKey: BooleanFilterKey;
  activeClassName: string;
  search: string;
  searchTerms?: string[];
};

/**
 * Radio-style Yes/No chips. Selecting an already-active value clears it;
 * selecting the other value replaces it (never ["true","false"]).
 */
export function BooleanFilterSection({
  header,
  filterKey,
  activeClassName,
  search,
  searchTerms,
}: BooleanFilterSectionProps) {
  const [filters, setFilters] = useAtom(operatorShelterFiltersAtom);

  if (!headerMatches(header, search, searchTerms)) return null;

  const selected = filters[filterKey];

  function toggleBoolean(value: 'true' | 'false') {
    setFilters((prev) => {
      const current = prev[filterKey];
      return { ...prev, [filterKey]: current.includes(value) ? [] : [value] };
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
      <FilterChip
        label="Yes"
        active={selected.includes('true')}
        activeClassName={activeClassName}
        onClick={() => toggleBoolean('true')}
      />
      <FilterChip
        label="No"
        active={selected.includes('false')}
        activeClassName={activeClassName}
        onClick={() => toggleBoolean('false')}
      />
    </FilterSection>
  );
}
