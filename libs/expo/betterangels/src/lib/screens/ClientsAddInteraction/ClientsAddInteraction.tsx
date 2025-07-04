import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar, TextBold } from '@monorepo/expo/shared/ui-components';
import { ElementType, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ClientCard,
  ClientProfileList,
  CreateClientInteractionBtn,
  Header,
} from '../../ui-components';

export function ClientsAddInteraction({ Logo }: { Logo: ElementType }) {
  const [search, setSearch] = useState('');

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
          }}
          onClear={() => {
            setSearch('');
          }}
          style={{ marginBottom: Spacings.xs }}
        />

        <ClientProfileList
          filters={{
            search,
          }}
          renderItem={(client) => (
            <CreateClientInteractionBtn clientProfileId={client.id}>
              <ClientCard client={client} />
            </CreateClientInteractionBtn>
          )}
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
    paddingHorizontal: Spacings.sm,
    marginTop: Spacings.sm,
  },
});
