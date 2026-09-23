import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { InfiniteList, SearchBar } from '@monorepo/expo/shared/ui-components';
import { ElementType, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HmisClientProfileType } from '../apollo';
import { pagePaddingHorizontal } from '../static';
import { ClientCardHmis, Header, HorizontalContainer } from '../ui-components';

/**
 * Entry screen for the HMIS prod feature (experimental).
 *
 * Rendered by the clients tab when `FeatureFlags.HMIS_PROD_DEMO` is active.
 * Feature-private: nothing else under `lib/hmisProd` is exported publicly.
 *
 * UI-first for now: mirrors the standard `Clients` screen but renders local
 * mock data. TODO: replace mocks with direct HMIS `/api1/clients/long` calls.
 */

// TODO: temporary mock data. `hmisId` is intentionally empty so
// `useClientPhotoContentUriHmis` doesn't build thumbnail URLs and fire image
// requests before the HMIS API is wired up.
const MOCK_CLIENTS = [
  {
    id: 'mock-1',
    hmisId: '',
    firstName: 'Jane',
    lastName: 'Doe',
    alias: 'J.D.',
    birthDate: '1985-04-12T00:00:00Z',
    age: 40,
    heightInInches: 66,
    residenceAddress: '123 Main St, Los Angeles, CA 90012',
    uniqueIdentifier: 'HMIS-000123',
  },
  {
    id: 'mock-2',
    hmisId: '',
    firstName: 'John',
    lastName: 'Smith',
    birthDate: '1979-11-02T00:00:00Z',
    age: 45,
    heightInInches: 71,
    residenceAddress: '456 Sunset Blvd, Los Angeles, CA 90028',
    uniqueIdentifier: 'HMIS-000456',
  },
  {
    id: 'mock-3',
    hmisId: '',
    firstName: 'Alex',
    lastName: 'Rivera',
    alias: 'Lex',
    birthDate: '1992-06-25T00:00:00Z',
    age: 33,
    heightInInches: 63,
    residenceAddress: null,
    uniqueIdentifier: 'HMIS-000789',
  },
] as unknown as HmisClientProfileType[];

export function ClientScreenHmisProd({ Logo }: { Logo: ElementType }) {
  const [search, setSearch] = useState('');

  const clients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return MOCK_CLIENTS;
    }

    return MOCK_CLIENTS.filter((client) => {
      const name = `${client.firstName ?? ''} ${client.lastName ?? ''}`;
      const identifier = client.uniqueIdentifier ?? '';

      return (
        name.toLowerCase().includes(term) ||
        identifier.toLowerCase().includes(term)
      );
    });
  }, [search]);

  return (
    <View style={styles.container} testID="hmis-prod-clients-screen">
      <Header title="HMIS Clients" Logo={Logo} />

      <View style={styles.content}>
        <HorizontalContainer>
          <SearchBar
            value={search}
            placeholder="Search name, HMIS ID"
            testID="hmis-prod-clients-search-input"
            onChange={(text) => setSearch(text)}
            onClear={() => setSearch('')}
            style={{ marginBottom: Spacings.xs }}
          />
        </HorizontalContainer>

        <InfiniteList
          modelName="client"
          data={clients}
          keyExtractor={(client) => client.id}
          totalItems={clients.length}
          renderItem={(client) => <ClientCardHmis client={client} />}
          hasMore={false}
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
