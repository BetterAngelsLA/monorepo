import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar, TextBold } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { ElementType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { pagePaddingHorizontal } from '../../static';
import {
  ClientCardHMIS,
  Header,
  HmisListClients,
  HorizontalContainer,
} from '../../ui-components';
import { HmisClientProfilesQuery } from '../../ui-components/ClientProfileList/__generated__/HmisListClients.generated';

type THmisClientProfile =
  HmisClientProfilesQuery['hmisClientProfiles']['results'][number];

export function ClientsAddNoteHmis({ Logo }: { Logo: ElementType }) {
  const [search, setSearch] = useState('');

  const handleClientPress = useCallback((id: string) => {
    router.navigate(`/notes-hmis/create?clientId=${id}`);
  }, []);

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

        <HmisListClients
          filters={{ search }}
          renderItem={renderHmisClientItem}
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
