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
import { ElementType, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { uniqueBy } from 'remeda';
import { Ordering } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { ClientCard, ClientCardModal, Header } from '../../ui-components';
import {
  ClientProfilesQuery,
  useClientProfilesQuery,
  useCreateNoteMutation,
} from './__generated__/Clients.generated';
type TClientProfile = ClientProfilesQuery['clientProfiles']['results'];

const paginationLimit = 20;

export default function Clients({ Logo }: { Logo: ElementType }) {
  const [currentClient, setCurrentClient] = useState<TClientProfile[number]>();
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [clients, setClients] = useState<TClientProfile>([]);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const { data, loading } = useClientProfilesQuery({
    variables: {
      pagination: { limit: paginationLimit, offset },
      filters: {
        search: filterSearch,
      },
      order: {
        firstName: Ordering.AscNullsLast,
        id: Ordering.Desc,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const { title, select } = useLocalSearchParams();
  const [search, setSearch] = useState<string>('');
  const [createNote] = useCreateNoteMutation();
  const { showSnackbar } = useSnackbar();

  const router = useRouter();

  async function loadMoreClients() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }
  async function createNoteFunction(
    id: string,
    firstName: string | undefined | null
  ) {
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
        router.navigate(`/add-note/${data?.createNote.id}`);
      }
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: `Sorry, there was an error creating a new interaction.`,
        type: 'error',
      });
    }
  }

  const renderFooter = () => {
    return loading ? (
      <View style={{ marginTop: 10, alignItems: 'center' }}>
        <Loading size="large" color={Colors.NEUTRAL_DARK} />
      </View>
    ) : null;
  };

  const debounceFetch = useMemo(
    () =>
      debounce((text) => {
        setFilterSearch(text);
      }, 500),
    []
  );

  useEffect(() => {
    setOffset(0);
    setClients([]);
  }, [filterSearch]);

  const onChange = (e: string) => {
    setSearch(e);

    debounceFetch(e);
  };

  useEffect(() => {
    if (!data || !('clientProfiles' in data)) {
      return;
    }
    const { results, totalCount } = data.clientProfiles;
    setTotalCount(totalCount);

    if (offset === 0) {
      setClients(results);
    } else {
      setClients((prevClients) =>
        uniqueBy([...prevClients, ...results], (client) => client.id)
      );
    }

    setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Clients" Logo={Logo} />
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          paddingHorizontal: Spacings.sm,
          paddingTop: Spacings.sm,
        }}
      >
        {title && (
          <TextBold mb="sm" size="lg">
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: Spacings.xs,
            backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          }}
        >
          <TextMedium size="sm">
            Displaying {clients.length} of {totalCount} clients
          </TextMedium>
        </View>
        {search && clients.length < 1 && (
          <View
            style={{
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center',
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
              <UserSearchIcon size="2xl" color={Colors.PRIMARY} />
            </View>
            <TextBold mb="xs" size="sm">
              No Results
            </TextBold>
            <TextRegular size="sm">
              Try searching for something else.
            </TextRegular>
          </View>
        )}
        {!!clients.length && (
          <FlatList
            style={{
              flex: 1,
              backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
              paddingBottom: 80,
              marginTop: Spacings.xs,
            }}
            data={clients}
            renderItem={({ item: clientProfile }) =>
              clients ? (
                <ClientCard
                  client={clientProfile}
                  arrivedFrom="/clients"
                  select={select as string}
                  onPress={() => {
                    if (select === 'true') {
                      createNoteFunction(
                        clientProfile.id,
                        clientProfile.firstName
                      );
                    } else {
                      setCurrentClient(clientProfile);
                      setModalIsOpen(true);
                    }
                  }}
                  mb="sm"
                />
              ) : null
            }
            keyExtractor={(clientProfile) => clientProfile.id}
            onEndReached={loadMoreClients}
            onEndReachedThreshold={0.05}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
      {currentClient && (
        <ClientCardModal
          isModalVisible={modalIsOpen}
          closeModal={() => setModalIsOpen(false)}
          clientProfile={currentClient}
        />
      )}
    </View>
  );
}
