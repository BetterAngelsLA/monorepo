import { UserAddOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Loading,
  TextBold,
  TextButton,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ElementType, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { TFullClientProfile } from '../../apollo/graphql/types/clientProfile';
import { ClientCard, ClientCardModal, Header } from '../../ui-components';
import { useActiveClientProfilesPaginatedQuery } from './__generated__/activeClients.query.generated';

const paginationLimit = 20;

export default function Home({ Logo }: { Logo: ElementType }) {
  const router = useRouter();
  const [currentClient, setCurrentClient] = useState<TFullClientProfile>();
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [clients, setClients] = useState<TFullClientProfile[]>([]);
  const { data, loading } = useActiveClientProfilesPaginatedQuery({
    variables: {
      filters: { isActive: true },
      pagination: { limit: paginationLimit, offset: offset },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  async function loadMoreClients() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  const renderFooter = () => {
    return loading ? (
      <View style={{ marginTop: 10, alignItems: 'center' }}>
        <Loading size="large" color={Colors.NEUTRAL_DARK} />
      </View>
    ) : null;
  };

  useEffect(() => {
    if (!data || !('clientProfilesPaginated' in data)) {
      return;
    }
    const { results, totalCount } = data.clientProfilesPaginated;
    setTotalCount(totalCount);

    if (offset === 0) {
      setClients(results);
    } else {
      setClients((prevClients) => {
        // Merge new results with previous ones
        const combined = [...prevClients, ...results];

        // Use a Map to track unique clients by id
        const clientMap = new Map<string, (typeof combined)[number]>();
        for (const client of combined) {
          clientMap.set(client.id, client);
        }
        return Array.from(clientMap.values());
      });
    }

    setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT }}>
      <Header title="Home" Logo={Logo} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: Spacings.xs,
          paddingHorizontal: Spacings.sm,
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
        }}
      >
        <TextMedium size="sm">
          Displaying {clients.length} of {totalCount} Active Clients
        </TextMedium>
        <TextButton
          accessibilityHint="goes to all clients list"
          color={Colors.PRIMARY}
          fontSize="sm"
          regular={true}
          title="All Clients"
          onPress={() => router.navigate('/clients')}
        />
      </View>
      <FlatList
        style={{
          flex: 1,
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          paddingBottom: 80,
          marginTop: Spacings.xs,
          paddingHorizontal: Spacings.sm,
        }}
        data={clients}
        renderItem={({ item: clientProfile }) =>
          clients ? (
            <ClientCard
              arrivedFrom="/"
              onPress={() => {
                setCurrentClient(clientProfile);
                setModalIsOpen(true);
              }}
              mb="sm"
              client={clientProfile}
            />
          ) : null
        }
        keyExtractor={(clientProfile) => clientProfile.id}
        onEndReached={loadMoreClients}
        onEndReachedThreshold={0.05}
        ListHeaderComponent={
          !loading && clients.length < 1 ? (
            <View
              style={{
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: Spacings.xl,
              }}
            >
              <View
                style={{
                  height: 90,
                  width: 90,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: Radiuses.xxxl,
                  backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
                  marginBottom: Spacings.md,
                }}
              >
                <UserAddOutlineIcon size="2xl" color={Colors.PRIMARY} />
              </View>
              <TextBold mb="xs" size="sm">
                No Active Clients
              </TextBold>
              <TextRegular size="sm">
                Try adding a client or an interaction.
              </TextRegular>
            </View>
          ) : null
        }
        ListFooterComponent={renderFooter}
      />
      {currentClient && (
        <ClientCardModal
          isModalVisible={modalIsOpen}
          closeModal={() => setModalIsOpen(false)}
          client={currentClient}
        />
      )}
    </View>
  );
}
