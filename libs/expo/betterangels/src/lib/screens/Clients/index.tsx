import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { ElementType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ClientCardMemo,
  ClientCardModal,
  ClientProfileList,
  Header,
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
      <ClientCardMemo
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
        <SearchBar
          value={search}
          placeholder="Search by name"
          onChange={(text) => setSearch(text)}
          onClear={() => setSearch('')}
          style={{ marginBottom: Spacings.xs }}
        />

        <ClientProfileList
          filters={{
            search,
          }}
          renderItem={renderClientItem}
          // renderItem={(client) => (
          //   <ClientCard
          //     client={client}
          //     onMenuPress={setCurrentClient}
          //     onPress={(client) => {
          //       router.navigate({
          //         pathname: `/client/${client.id}`,
          //         params: {
          //           arrivedFrom: '/clients',
          //         },
          //       });
          //     }}
          //   />
          // )}
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
