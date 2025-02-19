import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Loading,
  TextButton,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import ClientCard from '../../ui-components/ClientCard';
import ClientCardModal from '../../ui-components/ClientCardModal';
import Header from '../../ui-components/Header';
import { useClientProfilesPaginatedQuery } from '../Clients/__generated__/Clients.generated';
import { ActiveClientProfilesPaginatedQuery } from './__generated__/ActiveClients.generated';

const paginationLimit = 20;
const ITEM_HEIGHT = 120; // adjust as needed

export default function Home({ Logo }: { Logo: React.ElementType }) {
  const router = useRouter();
  const [currentClient, setCurrentClient] =
    useState<
      ActiveClientProfilesPaginatedQuery['clientProfilesPaginated']['results'][number]
    >();
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [clients, setClients] = useState<
    ActiveClientProfilesPaginatedQuery['clientProfilesPaginated']['results']
  >([]);
  const { data, loading } = useClientProfilesPaginatedQuery({
    variables: {
      filters: { isActive: true },
      pagination: { limit: paginationLimit, offset },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMoreClients = useCallback(() => {
    if (hasMore && !loading && !isLoadingMore) {
      setIsLoadingMore(true);
      setOffset((prevOffset) => prevOffset + paginationLimit);
      setTimeout(() => setIsLoadingMore(false), 600);
    }
  }, [hasMore, loading, isLoadingMore]);

  const renderFooter = () => {
    return loading ? (
      <View style={homeStyles.footer}>
        <Loading size="large" color={Colors.NEUTRAL_DARK} />
      </View>
    ) : null;
  };

  useEffect(() => {
    if (!data || !('clientProfilesPaginated' in data)) return;
    const { results, totalCount } = data.clientProfilesPaginated;
    setTotalCount(totalCount);

    if (offset === 0) {
      setClients(results);
    } else {
      setClients((prevClients) => {
        const combined = [...prevClients, ...results];
        return combined.filter(
          (client, index, self) =>
            index === self.findIndex((c) => c.id === client.id)
        );
      });
    }
    setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

  return (
    <View style={homeStyles.screenContainer}>
      <Header title="Home" Logo={Logo} />
      <View style={homeStyles.headerRow}>
        <TextMedium size="sm">
          Displaying {clients.length} of {totalCount} Active Clients
        </TextMedium>
        <TextButton
          accessibilityHint="goes to all clients list"
          color={Colors.PRIMARY}
          fontSize="sm"
          regular
          title="All Clients"
          onPress={() => router.navigate('/clients')}
        />
      </View>
      <FlatList
        style={homeStyles.flatList}
        data={clients}
        renderItem={({ item: clientProfile }) => (
          <ClientCard
            arrivedFrom="/"
            onPress={() => {
              setCurrentClient(clientProfile);
              setModalIsOpen(true);
            }}
            mb="sm"
            client={clientProfile}
          />
        )}
        keyExtractor={(clientProfile) => String(clientProfile.id)}
        onEndReached={loadMoreClients}
        onEndReachedThreshold={0.05}
        ListFooterComponent={renderFooter}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
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

const homeStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  flatList: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    paddingBottom: 80,
    marginTop: Spacings.xs,
    paddingHorizontal: Spacings.sm,
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
});
