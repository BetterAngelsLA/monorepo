import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
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
};

export function InteractionFilters(props: TProps) {
  const { onChange, selected, currentUserLabel, style } = props;

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

  return (
    <Filters style={style}>
      <FilterStatic
        buttonLabel="All Teams"
        withLocalFilter
        withSelectAll
        title="Filter - Teams"
        options={teamOptions}
        onChange={(next) => onFilterChange('teams', next)}
        initialSelected={selected.teams}
        searchPlaceholder="Search teams"
      />

      <FilterUsers
        buttonLabel={'All Authors'}
        title="Filter - Author"
        currentUserId={user?.id}
        currentUserLabel={currentUserLabel}
        onChange={(next) => onFilterChange('authors', next)}
        initialSelected={selected.authors}
        searchPlaceholder="Search authors"
      />

      <FilterOrganizations
        buttonLabel={'All Organizations'}
        title="Filter - Organizations"
        onChange={(next) => onFilterChange('organizations', next)}
        initialSelected={selected.organizations}
        searchPlaceholder="Search organizations"
      />
    </Filters>
  );
}
