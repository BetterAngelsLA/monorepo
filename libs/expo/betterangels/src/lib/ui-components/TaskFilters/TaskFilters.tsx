import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { hashObject } from '@monorepo/expo/shared/utils';
import { useState } from 'react';
import { ViewStyle } from 'react-native';
import { useUser } from '../../hooks';
import { FilterClients, FilterStatic, FilterUsers } from '../Filters';
import { statusOptions, teamOptions } from './constants';
import { TSelectedTaskFilters, TTaskFilterType } from './types';

type TProps = {
  onChange: (selected: TSelectedTaskFilters) => void;
  style?: ViewStyle;
  currentUserLabel?: string;
};

const emptyFilters: TSelectedTaskFilters = {
  author: [],
  client: [],
  status: [],
  team: [],
};

export function TaskFilters(props: TProps) {
  const { currentUserLabel = 'Me', style } = props;

  const { user } = useUser();

  const [selectedFilters, setSelectedFilters] = useState<TSelectedTaskFilters>({
    ...emptyFilters,
    author: user ? [{ id: user.id, label: currentUserLabel }] : [],
  });

  function onFilterChange(
    filterType: TTaskFilterType,
    selected: TFilterOption[]
  ) {
    const filterHash = hashObject({
      data: selected,
      keyList: ['id'],
      keyListStrategy: 'include',
    });

    console.log('*****************  filterHash:', filterHash);

    setSelectedFilters((prev) => {
      return {
        ...prev,
        [filterType]: selected,
      };
    });
  }

  return (
    <Filters style={style}>
      <FilterClients
        label={'Clients'}
        title="Filter - Client"
        onChange={(next) => onFilterChange('client', next)}
        selected={selectedFilters.client}
      />
      <FilterUsers
        label={'Authors'}
        title="Filter - Author"
        currentUserId={user?.id}
        currentUserLabel={currentUserLabel}
        onChange={(next) => onFilterChange('author', next)}
        selected={selectedFilters.author}
      />
      <FilterStatic
        label="Teams"
        options={teamOptions}
        title="Filter - Teams"
        onChange={(next) => onFilterChange('team', next)}
        selected={selectedFilters.team}
      />
      <FilterStatic
        label="Status"
        options={statusOptions}
        title="Filter - Status"
        onChange={(next) => onFilterChange('status', next)}
        selected={selectedFilters.status}
      />
    </Filters>
  );
}
