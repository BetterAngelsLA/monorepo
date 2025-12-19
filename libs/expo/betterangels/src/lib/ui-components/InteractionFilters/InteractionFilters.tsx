import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { useUser } from '../../hooks';
import { FilterOrganizations, FilterStatic, FilterUsers } from '../Filters';
import { teamOptions } from './constants';
import { TInteractionFilterType, TInteractionFilters } from './types';

const DEFAULT_FILTERS: ReadonlyArray<TInteractionFilterType> = [
  'teams',
  'authors',
  'organizations',
];

type TProps = {
  onChange: (newSelected: TInteractionFilters) => void;
  selected: TInteractionFilters;
  style?: ViewStyle;
  currentUserLabel?: string;
  filters?: ReadonlyArray<TInteractionFilterType>;
};

export function InteractionFilters(props: TProps) {
  const { onChange, selected, currentUserLabel, filters, style } = props;

  const { user } = useUser();

  function onFilterChange(
    filterType: TInteractionFilterType,
    selectedOpts: TFilterOption[]
  ) {
    onChange({
      ...selected,
      [filterType]: selectedOpts,
    });
  }

  // define filters to show (in order)
  const orderedFilterTypes = useMemo(() => {
    if (!filters || filters.length === 0) {
      return DEFAULT_FILTERS;
    }

    // dedupe
    const seen = new Set<TInteractionFilterType>();
    const orderedFilters: TInteractionFilterType[] = [];

    for (const filterType of filters) {
      if (seen.has(filterType)) {
        continue;
      }

      seen.add(filterType);
      orderedFilters.push(filterType);
    }

    return orderedFilters;
  }, [filters]);

  return (
    <Filters style={style}>
      {orderedFilterTypes.map((filterType) => {
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

        if (filterType === 'organizations') {
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
        }

        console.warn(`[InteractionFilters]: invalid filter list: ${filters}`);

        return null;
      })}
    </Filters>
  );
}
