import { SearchIcon, UserSearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Loading,
  TextBold,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Ordering } from '../../apollo';
import { useSnackbar } from '../../hooks';
import ClientCard from '../../ui-components/ClientCard';
import ClientCardModal from '../../ui-components/ClientCardModal';
import Header from '../../ui-components/Header';
import {
  ClientProfilesPaginatedQuery,
  useClientProfilesPaginatedQuery,
  useCreateNoteMutation,
} from './__generated__/Clients.generated';

const paginationLimit = 20;
// Approximate fixed height for each ClientCard (adjust if needed)
const ITEM_HEIGHT = 120;

export default function Clients({ Logo }: { Logo: React.ElementType }) {
  const router = useRouter();
  const [currentClient, setCurrentClient] =
    useState<
      ClientProfilesPaginatedQuery['clientProfilesPaginated']['results'][number]
    >();
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [clients, setClients] = useState<
    ClientProfilesPaginatedQuery['clientProfilesPaginated']['results']
  >([]);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const { title, select } = useLocalSearchParams();
  const { showSnackbar } = useSnackbar();

  const { data, loading } = useClientProfilesPaginatedQuery({
    variables: {
      pagination: { limit: paginationLimit, offset },
      filters: { search: filterSearch },
      order: {
        user_FirstName: Ordering.AscNullsFirst,
        id: Ordering.Desc,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [createNote] = useCreateNoteMutation();

  // Debounce the search input
  const debounceFetch = useMemo(
    () => debounce((text: string) => setFilterSearch(text), 500),
    []
  );

  const onChange = (text: string) => {
    setSearch(text);
    debounceFetch(text);
  };

  // Reset offset and clear clients when search filter changes
  useEffect(() => {
    setOffset(0);
    setClients([]);
  }, [filterSearch]);

  // Merge new paginated results, filtering out duplicates by id
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

  const loadMoreClients = useCallback(() => {
    if (hasMore && !loading && !isLoadingMore) {
      setIsLoadingMore(true);
      setOffset((prevOffset) => prevOffset + paginationLimit);
      setTimeout(() => setIsLoadingMore(false), 600);
    }
  }, [hasMore, loading, isLoadingMore]);

  // Memoize onPress handler for each ClientCard
  const handleClientPress = useCallback(
    (
      clientProfile: ClientProfilesPaginatedQuery['clientProfilesPaginated']['results'][number]
    ) => {
      if (select === 'true') {
        createNoteFunction(clientProfile.user.id, clientProfile.user.firstName);
      } else {
        setCurrentClient(clientProfile);
        setModalIsOpen(true);
      }
    },
    [select]
  );

  // Create note function
  const createNoteFunction = useCallback(
    async (id: string, firstName: string | null | undefined) => {
      try {
        const { data } = await createNote({
          variables: {
            data: {
              purpose: `Session with ${firstName || 'Client'}`,
              client: id,
            },
          },
        });
        if (data?.createNote && 'id' in data.createNote) {
          router.navigate(`/add-note/${data.createNote.id}`);
        }
      } catch (err) {
        console.error(err);
        showSnackbar({
          message: `Sorry, there was an error creating a new interaction.`,
          type: 'error',
        });
      }
    },
    [createNote, router, showSnackbar]
  );

  const renderFooter = () => {
    return loading ? (
      <View style={localStyles.footer}>
        <Loading size="large" color={Colors.NEUTRAL_DARK} />
      </View>
    ) : null;
  };

  return (
    <View style={localStyles.screenContainer}>
      <Header title="Clients" Logo={Logo} />
      <View style={localStyles.contentContainer}>
        {title && (
          <TextBold style={localStyles.title} size="lg">
            {title}
          </TextBold>
        )}
        <BasicInput
          icon={<SearchIcon ml="sm" color={Colors.NEUTRAL} />}
          value={search}
          placeholder="Search by name"
          autoCorrect={false}
          onChangeText={onChange}
          onDelete={() => {
            setSearch('');
            setFilterSearch('');
            setOffset(0);
            setClients([]);
          }}
        />
        <View style={localStyles.infoRow}>
          <TextMedium size="sm">
            Displaying {clients.length} of {totalCount} clients
          </TextMedium>
        </View>
        {search && clients.length < 1 ? (
          <View style={localStyles.noResultsContainer}>
            <View style={localStyles.noResultsIcon}>
              <UserSearchIcon size="2xl" color={Colors.PRIMARY} />
            </View>
            <TextBold mb="xs" size="sm">
              No Results
            </TextBold>
            <TextRegular size="sm">
              Try searching for something else.
            </TextRegular>
          </View>
        ) : (
          <FlatList
            style={localStyles.flatList}
            data={clients}
            renderItem={({ item: clientProfile }) => (
              <ClientCard
                client={clientProfile}
                arrivedFrom="/clients"
                select={select as string}
                onPress={() => handleClientPress(clientProfile)}
                mb="sm"
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
        )}
      </View>
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

const localStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.sm,
  },
  title: {
    marginBottom: Spacings.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacings.xs,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  noResultsContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsIcon: {
    height: 90,
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxl,
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    marginBottom: Spacings.md,
  },
  flatList: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    paddingBottom: 80,
    marginTop: Spacings.xs,
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
});
