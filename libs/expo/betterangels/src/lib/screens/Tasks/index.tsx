import { Colors } from '@monorepo/expo/shared/static';
import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useUser } from '../../hooks';
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../static';
import {
  FilterClients,
  FilterStatic,
  FilterUsers,
  MainContainer,
} from '../../ui-components';

const statusOptions: TFilterOption[] = Object.entries(
  enumDisplayTaskStatus
).map(([key, value]) => ({
  id: key,
  label: value,
}));

const teamOptions: TFilterOption[] = Object.entries(enumDisplaySelahTeam).map(
  ([key, value]) => ({
    id: key,
    label: value,
  })
);

export default function Tasks() {
  const { user } = useUser();

  const currentUserLabel = 'Me';

  const [selectedTeams, setSelectedTeams] = useState<TFilterOption[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TFilterOption[]>([]);
  const [selectedClients, setSelectedClients] = useState<TFilterOption[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<TFilterOption[]>(
    user ? [{ id: user.id, label: currentUserLabel }] : []
  );

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      {/* <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          placeholder="Search tasks"
          onChange={(text) => {
            setSearch(text);
          }}
          onClear={() => {
            setSearch('');
          }}
          debounceMs={100}
        />
        <TextButton
          onPress={onFiltersReset}
          regular
          fontSize="sm"
          title="Reset"
          accessibilityHint="Reset filters"
        />
      </View> */}

      <Filters style={{ marginTop: 50 }}>
        <FilterClients
          label={'Clients'}
          title="Filter - Client"
          onChange={setSelectedClients}
          selected={selectedClients}
        />
        <FilterUsers
          label={'Authors'}
          title="Filter - Author x"
          onChange={setSelectedAuthors}
          selected={selectedAuthors}
          currentUserId={user?.id}
          currentUserLabel={currentUserLabel}
        />
        <FilterStatic
          label="Teams"
          options={teamOptions}
          title="Filter - Teams"
          onChange={setSelectedTeams}
          selected={selectedTeams}
        />
        <FilterStatic
          label="Status"
          options={statusOptions}
          title="Filter - Status"
          onChange={setSelectedStatus}
          selected={selectedStatus}
        />
      </Filters>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
  },
});
