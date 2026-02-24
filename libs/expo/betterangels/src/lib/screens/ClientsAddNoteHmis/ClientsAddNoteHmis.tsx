import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar, TextBold } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { ElementType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { pagePaddingHorizontal } from '../../static';
import {
  ClientCardHmis,
  Header,
  HorizontalContainer,
  ListClientsHmis,
} from '../../ui-components';
import { ClientProfilesHmisQuery } from '../../ui-components/ClientProfileList/__generated__/ListClientsHmis.generated';

type TClientProfileHmis =
  ClientProfilesHmisQuery['hmisClientProfiles']['results'][number];

export function ClientsAddNoteHmis({ Logo }: { Logo: ElementType }) {
  const [search, setSearch] = useState('');

  const handleClientPress = useCallback((id: string) => {
    router.navigate(`/notes-hmis/create?clientId=${id}`);
  }, []);

  const renderClientItemHmis = useCallback(
    (client: TClientProfileHmis) => {
      const { id } = client;

      if (!id) {
        return null;
      }

      return (
        <ClientCardHmis client={client} onPress={() => handleClientPress(id)} />
      );
    },
    [handleClientPress]
  );

  return (
    <View style={styles.container}>
      <Header title="Clients" Logo={Logo} />

      <View style={styles.content}>
        <HorizontalContainer>
          <TextBold mb="sm" size="lg">
            Who is this note for?
          </TextBold>

          <SearchBar
            value={search}
            placeholder="Search by name"
            onChange={(text) => {
              setSearch(text);
            }}
            onClear={() => {
              setSearch('');
            }}
            style={{ marginBottom: Spacings.xs }}
          />
        </HorizontalContainer>

        <ListClientsHmis
          filters={{ search }}
          renderItem={renderClientItemHmis}
          style={{ paddingHorizontal: pagePaddingHorizontal }}
        />
      </View>
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
