import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { ViewStyle } from 'react-native';
import { useUser } from '../../hooks';
import { FilterOrganizations, FilterStatic, FilterUsers } from '../Filters';
import { statusOptions, teamOptions } from './constants';
import { TTaskFilterType, TTaskFilters } from './types';

type TProps = {
  onChange: (newSelected: TTaskFilters) => void;
  selected: TTaskFilters;
  style?: ViewStyle;
  currentUserLabel?: string;
};

export function TaskFilters(props: TProps) {
  const { onChange, selected, currentUserLabel, style } = props;

  const { user } = useUser();

  function onFilterChange(
    filterType: TTaskFilterType,
    selectedOpts: TFilterOption[]
  ) {
    onChange({
      ...selected,
      [filterType]: selectedOpts,
    });
  }

  return (
    <Filters style={style}>
      {/* ADD BACK once DEV-2155 completed and update FilterClients component
      <FilterClients
        buttonLabel={'Clients'}
        title="Filter - Client"
        onChange={(next) => onFilterChange('clientProfile', next)}
        initialSelected={selected.clientProfile}
        searchPlaceholder="Search clients"
      /> */}

      <FilterStatic
        buttonLabel="Teams"
        withLocalFilter
        withSelectAll
        title="Filter - Teams"
        options={teamOptions}
        onChange={(next) => onFilterChange('teams', next)}
        initialSelected={selected.teams}
        searchPlaceholder="Search teams"
      />

      <FilterStatic
        buttonLabel="Status"
        withSelectAll
        options={statusOptions}
        title="Filter - Status"
        onChange={(next) => onFilterChange('status', next)}
        initialSelected={selected.status}
      />

      <FilterUsers
        buttonLabel={'Authors'}
        title="Filter - Author"
        currentUserId={user?.id}
        currentUserLabel={currentUserLabel}
        onChange={(next) => onFilterChange('authors', next)}
        initialSelected={selected.authors}
        searchPlaceholder="Search authors"
      />

      <FilterOrganizations
        buttonLabel={'Organizations'}
        title="Filter - Organizations"
        onChange={(next) => onFilterChange('organizations', next)}
        initialSelected={selected.organizations}
        searchPlaceholder="Search organizations"
      />
    </Filters>
  );
}
