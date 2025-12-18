import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { useUser } from '../../hooks';
import { FilterOrganizations, FilterStatic, FilterUsers } from '../Filters';
import { teamOptions } from './constants';
import { TInteractionFilterType, TInteractionFilters } from './types';

type TProps = {
  onChange: (newSelected: TInteractionFilters) => void;
  selected: TInteractionFilters;
  style?: ViewStyle;
  currentUserLabel?: string;

  /**
   * Which filters to render, and in what order.
   * - undefined: render default filters in default order
   * - ['teams', 'authors']: render only those filters
   */
  filters?: ReadonlyArray<TInteractionFilterType>;
};

const DEFAULT_FILTER_ORDER: ReadonlyArray<TInteractionFilterType> = [
  'teams',
  'authors',
  'organizations',
];

export function Filters(props: TProps) {
  const { onChange, selected, currentUserLabel, style, filters } = props;

  const { user } = useUser();

  const filtersToRender = useMemo(() => {
    if (!filters || filters.length === 0) {
      return DEFAULT_FILTER_ORDER;
    }

    // De-dupe while preserving order
    const seen = new Set<TInteractionFilterType>();
    const uniqueInOrder: TInteractionFilterType[] = [];

    for (const filterType of filters) {
      if (seen.has(filterType)) {
        continue;
      }

      seen.add(filterType);
      uniqueInOrder.push(filterType);
    }

    return uniqueInOrder;
  }, [filters]);

  function onFilterChange(
    filterType: TInteractionFilterType,
    selectedOpts: TFilterOption[]
  ) {
    onChange({
      ...selected,
      [filterType]: selectedOpts,
    });
  }

  return (
    <Filters style={style}>
      {filtersToRender.map((filterType) => {
        if (filterType === 'teams') {
          return (
            <FilterStatic
              key="teams"
              buttonLabel="All Teams"
              withLocalFilter
              withSelectAll
              title="Filter - Teams"
              options={teamOptions}
              onChange={(next) => onFilterChange('teams', next)}
              initialSelected={selected.teams}
              searchPlaceholder="Search teams"
            />
          );
        }

        if (filterType === 'authors') {
          return (
            <FilterUsers
              key="authors"
              buttonLabel="All Authors"
              title="Filter - Author"
              currentUserId={user?.id}
              currentUserLabel={currentUserLabel}
              onChange={(next) => onFilterChange('authors', next)}
              initialSelected={selected.authors}
              searchPlaceholder="Search authors"
            />
          );
        }

        // organizations
        return (
          <FilterOrganizations
            key="organizations"
            buttonLabel="All Organizations"
            title="Filter - Organizations"
            onChange={(next) => onFilterChange('organizations', next)}
            initialSelected={selected.organizations}
            searchPlaceholder="Search organizations"
          />
        );
      })}
    </Filters>
  );
}
