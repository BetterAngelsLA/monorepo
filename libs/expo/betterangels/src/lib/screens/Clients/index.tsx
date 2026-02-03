import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { ElementType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useUser } from '../../hooks';
import { pagePaddingHorizontal } from '../../static';
import {
  ClientCard,
  ClientCardHMIS,
  ClientCardModal,
  ClientProfileList,
  Header,
  HmisListClients,
  HorizontalContainer,
} from '../../ui-components';
import { HmisClientProfilesQuery } from '../../ui-components/ClientProfileList/__generated__/HmisListClients.generated';
import { ClientProfilesQuery } from './__generated__/Clients.generated';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];
type THmisClientProfile =
  HmisClientProfilesQuery['hmisClientProfiles']['results'][number];

export default function Clients({ Logo }: { Logo: ElementType }) {
  const [currentClient, setCurrentClient] = useState<TClientProfile | null>(
    null
  );
  const [search, setSearch] = useState('');
  const { isHmisUser } = useUser();

  const handleClientPress = useCallback((id: string) => {
    router.navigate({
      pathname: `/client/${id}`,
      params: { arrivedFrom: '/' },
    });
  }, []);

  const renderClientItem = useCallback(
    (client: TClientProfile) => (
      <ClientCard
        client={client}
        onMenuPress={setCurrentClient}
        onPress={() => handleClientPress(client.id)}
      />
    ),
    [setCurrentClient, handleClientPress]
  );

  const renderHmisClientItem = useCallback(
    (client: THmisClientProfile) => {
      const { id } = client;

      if (!id) {
        return null;
      }

      return (
        <ClientCardHMIS client={client} onPress={() => handleClientPress(id)} />
      );
    },
    [handleClientPress]
  );

  return (
    <View style={styles.container}>
      <Header title="Clients" Logo={Logo} />

      <View style={styles.content}>
        <HorizontalContainer>
          <SearchBar
            value={search}
            placeholder="Search by name clients"
            onChange={(text) => setSearch(text)}
            onClear={() => setSearch('')}
            style={{ marginBottom: Spacings.xs }}
          />
        </HorizontalContainer>

        {isHmisUser ? (
          <HmisListClients
            filters={{ search }}
            renderItem={renderHmisClientItem}
            style={{ paddingHorizontal: pagePaddingHorizontal }}
          />
        ) : (
          <ClientProfileList
            filters={{ search }}
            renderItem={renderClientItem}
          />
        )}
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
    marginTop: Spacings.sm,
  },
});
