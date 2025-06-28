import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import { ElementType, useState } from 'react';
import { View } from 'react-native';
import { useSnackbar } from '../../hooks';
import {
  ClientCard,
  ClientCardModal,
  ClientProfileList,
  Header,
  SearchBar,
} from '../../ui-components';
import { ClientProfilesQuery } from './__generated__/Clients.generated';
type TClientProfile = ClientProfilesQuery['clientProfiles']['results'];

const paginationLimit = 20;

export default function Clients({ Logo }: { Logo: ElementType }) {
  const [currentClient, setCurrentClient] = useState<TClientProfile[number]>();
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [clients, setClients] = useState<TClientProfile>([]);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const { title, select } = useLocalSearchParams();
  const [search, setSearch] = useState<string>('');
  const { showSnackbar } = useSnackbar();

  return (
    <View style={{ flex: 1 }}>
      <Header title="Clients" Logo={Logo} />
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          paddingHorizontal: Spacings.sm,
          paddingTop: Spacings.sm,
        }}
      >
        {title && (
          <TextBold mb="sm" size="lg">
            {title}
          </TextBold>
        )}

        <SearchBar
          value={search}
          debounceMs={300}
          placeholder="Search by name"
          onChange={(text) => {
            setSearch(text);
            setFilterSearch(text);
          }}
          onClear={() => {
            setSearch('');
            setFilterSearch('');
          }}
          style={{ marginBottom: Spacings.xs }}
        />

        <ClientProfileList
          filters={{
            search: filterSearch,
          }}
          renderItem={(client) => (
            <ClientCard
              client={client}
              arrivedFrom="/"
              onPress={(clientProfileId) => {
                console.log(
                  '[ClientProfileList CLIENTS] on PRESS clientProfileId: ',
                  clientProfileId
                );
              }}
              onMenuPress={() => {}}
            />
          )}
          renderHeader={({ totalClients, visibleClients }) => {
            return `Displaying ${visibleClients} of ${totalClients} Clients`;
          }}
        />
      </View>

      {currentClient && (
        <ClientCardModal
          isModalVisible={modalIsOpen}
          closeModal={() => setModalIsOpen(false)}
          clientProfile={currentClient}
        />
      )}
    </View>
  );
}
