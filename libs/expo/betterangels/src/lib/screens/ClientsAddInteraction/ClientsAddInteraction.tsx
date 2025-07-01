import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { ElementType, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ClientCard,
  ClientCardModal,
  ClientProfileList,
  CreateClientInteractionBtn,
  Header,
  SearchBar,
} from '../../ui-components';
import { ClientProfilesQuery } from '../Clients/__generated__/Clients.generated';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

export function ClientsAddInteraction({ Logo }: { Logo: ElementType }) {
  const [currentClient, setCurrentClient] = useState<TClientProfile | null>(
    null
  );
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  return (
    <View style={styles.container}>
      <Header title="Clients" Logo={Logo} />

      <View style={styles.content}>
        <TextBold mb="sm" size="lg">
          Who is this interaction for?
        </TextBold>

        <SearchBar
          value={search}
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
            <CreateClientInteractionBtn clientProfileId={client.id}>
              <ClientCard client={client} />
            </CreateClientInteractionBtn>
          )}
        />
      </View>

      {currentClient && (
        <ClientCardModal
          isModalVisible={!!currentClient}
          closeModal={() => setCurrentClient(null)}
          clientProfile={currentClient}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacings.sm,
    marginTop: Spacings.sm,
  },
});
