import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { ElementType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useUser } from '../../hooks';
import { pagePaddingHorizontal } from '../../static';
import {
  ClientCard,
  ClientCardHmis,
  ClientCardModal,
  ClientProfileList,
  Header,
  HorizontalContainer,
  ListClientsHmis,
} from '../../ui-components';
import { ClientProfilesQuery } from '../../ui-components/ClientProfileList/__generated__/ClientProfiles.generated';
import { ClientProfilesHmisQuery } from '../../ui-components/ClientProfileList/__generated__/ListClientsHmis.generated';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];
type TClientProfileHmis =
  ClientProfilesHmisQuery['hmisClientProfiles']['results'][number];

export default function Clients({ Logo }: { Logo: ElementType }) {
  const [currentClient, setCurrentClient] = useState<TClientProfile | null>(
    null
  );
  const [search, setSearch] = useState('');
  const { isHmisUser } = useUser();

  const renderClientItem = useCallback(
    (client: TClientProfile) => (
      <ClientCard
        arrivedFrom="/"
        client={client}
        onMenuPress={setCurrentClient}
      />
    ),
    [setCurrentClient]
  );

  const renderClientItemHmis = useCallback((client: TClientProfileHmis) => {
    const { id } = client;

    if (!id) {
      return null;
    }

    return <ClientCardHmis client={client} />;
  }, []);

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
          <ListClientsHmis
            filters={{ search }}
            renderItem={renderClientItemHmis}
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
