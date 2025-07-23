import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { ElementType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ClientCard,
  ClientCardModal,
  ClientProfileList,
  Header,
  HorizontalContainer,
} from '../../ui-components';
import { ClientProfilesQuery } from './__generated__/Clients.generated';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

export default function Clients({ Logo }: { Logo: ElementType }) {
  const [currentClient, setCurrentClient] = useState<TClientProfile | null>(
    null
  );
  const [search, setSearch] = useState('');

  const handleClientPress = useCallback((client: TClientProfile) => {
    router.navigate({
      pathname: `/client/${client.id}`,
      params: { arrivedFrom: '/clients' },
    });
  }, []);

  const renderClientItem = useCallback(
    (client: TClientProfile) => (
      <ClientCard
        client={client}
        onMenuPress={setCurrentClient}
        onPress={handleClientPress}
      />
    ),
    [setCurrentClient, handleClientPress]
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

        <ClientProfileList filters={{ search }} renderItem={renderClientItem} />
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
