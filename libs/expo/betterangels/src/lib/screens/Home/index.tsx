import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { router } from 'expo-router';
import { ElementType, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ClientCard,
  ClientCardModal,
  ClientProfileList,
  Header,
} from '../../ui-components';
import { ClientProfilesQuery } from './__generated__/ActiveClients.generated';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

export default function Home({ Logo }: { Logo: ElementType }) {
  const [currentClient, setCurrentClient] = useState<TClientProfile | null>(
    null
  );

  return (
    <View style={styles.container}>
      <Header title="Home" Logo={Logo} />

      <View style={styles.content}>
        <ClientProfileList
          filters={{ isActive: true }}
          renderItem={(client) => (
            <ClientCard
              client={client}
              onMenuPress={setCurrentClient}
              onPress={(client) => {
                router.navigate({
                  pathname: `/client/${client.id}`,
                  params: {
                    arrivedFrom: '/',
                  },
                });
              }}
            />
          )}
          renderHeaderText={({ totalClients, visibleClients }) =>
            `Displaying ${visibleClients} of ${totalClients} Active Clients`
          }
          showAllClientsLink={true}
        />
      </View>

      {!!currentClient && (
        <ClientCardModal
          isModalVisible={!!currentClient}
          clientProfile={currentClient}
          closeModal={() => {
            setCurrentClient(null);
          }}
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
