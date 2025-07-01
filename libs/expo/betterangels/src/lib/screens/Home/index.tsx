import { Colors, Spacings } from '@monorepo/expo/shared/static';
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
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT }}>
      <Header title="Home" Logo={Logo} />

      <View style={styles.content}>
        <ClientProfileList
          filters={{ isActive: true }}
          renderItem={(client) => (
            <ClientCard
              client={client}
              arrivedFrom="/"
              onMenuPress={(client) => {
                setCurrentClient(client);
                setModalIsOpen(true);
              }}
            />
          )}
          renderHeaderText={({ totalClients, visibleClients }) =>
            `Displaying ${visibleClients} of ${totalClients} Active Clients`
          }
          showAllClientsLink={true}
        />
      </View>

      {currentClient && (
        <ClientCardModal
          isModalVisible={modalIsOpen}
          closeModal={() => {
            setModalIsOpen(false);
            setCurrentClient(null);
          }}
          clientProfile={currentClient}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.sm,
  },
});
