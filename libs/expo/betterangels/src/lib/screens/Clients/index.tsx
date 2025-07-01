import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { router } from 'expo-router';
import { ElementType, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ClientCard,
  ClientCardModal,
  ClientProfileList,
  Header,
  SearchBar,
} from '../../ui-components';
import { ClientProfilesQuery } from './__generated__/Clients.generated';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

export default function Clients({ Logo }: { Logo: ElementType }) {
  const [currentClient, setCurrentClient] = useState<TClientProfile | null>(
    null
  );
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  return (
    <View style={styles.container}>
      <Header title="Clients" Logo={Logo} />

      <View style={styles.content}>
        {/* Who is this interaction for? */}
        {/* {title && (
          <TextBold mb="sm" size="lg">
            {title}
          </TextBold>
        )} */}

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
            <ClientCard
              client={client}
              onMenuPress={setCurrentClient}
              onPress={(client) => {
                router.navigate({
                  pathname: `/client/${client.id}`,
                  params: {
                    arrivedFrom: '/clients',
                  },
                });
              }}
            />
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
