import { SearchIcon, UserSearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  ClientCard,
  Loading,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ElementType, useEffect, useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import { ClientProfileType, Ordering } from '../../apollo';
import { ClientCardModal, Header } from '../../ui-components';
import {
  ClientProfilesQuery,
  useClientProfilesQuery,
  useCreateNoteMutation,
} from './__generated__/Clients.generated';

const paginationLimit = 20;

interface IGroupedClients {
  [key: string]: {
    title: string;
    data: ClientProfilesQuery['clientProfiles'];
  };
}

export default function Clients({ Logo }: { Logo: ElementType }) {
  const { title, select } = useLocalSearchParams();
  const [search, setSearch] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [createNote] = useCreateNoteMutation();
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { data, loading } = useClientProfilesQuery({
    variables: {
      pagination: { limit: paginationLimit + 1, offset },
      filters: {
        search: filterSearch,
      },
      order: {
        user_FirstName: Ordering.AscNullsFirst,
        id: Ordering.Desc,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [clients, setClients] = useState<IGroupedClients>({});
  const [currentClient, setCurrentClient] = useState<ClientProfileType>();
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  const router = useRouter();

  function loadMoreClients() {
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
            title: `Session with ${firstName || 'Client'}`,
            client: id,
          },
        },
      });
      if (data?.createNote && 'id' in data.createNote) {
        router.navigate(`/add-note/${data?.createNote.id}`);
      }
    } catch (err) {
      console.log(err);
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
    setClients({});
  }, [filterSearch]);

  const onChange = (e: string) => {
    setSearch(e);

    debounceFetch(e);
  };

  useEffect(() => {
    if (!data || !('clientProfiles' in data)) return;

    const clientsToShow = data.clientProfiles.slice(0, paginationLimit);
    const isMoreAvailable = data.clientProfiles.length > clientsToShow.length;

    const groupedContacts = clientsToShow.reduce(
      (acc: IGroupedClients, client) => {
        const firstLetter =
          client.user.firstName?.charAt(0).toUpperCase() || '#';

        if (!acc[firstLetter]) {
          acc[firstLetter] = {
            title: firstLetter,
            data: [],
          };
        }
        acc[firstLetter].data.push(client);
        return acc;
      },
      {}
    );

    setClients((prevClients) => {
      if (offset === 0) {
        return groupedContacts;
      }

      const mergedClients = { ...prevClients };

      Object.keys(groupedContacts).forEach((key) => {
        if (mergedClients[key]) {
          mergedClients[key].data = [
            ...mergedClients[key].data,
            ...groupedContacts[key].data,
          ];
        } else {
          mergedClients[key] = groupedContacts[key];
        }
      });

      return mergedClients;
    });

    setHasMore(isMoreAvailable);
  }, [data, offset]);

  const sections = useMemo(() => Object.values(clients || {}), [clients]);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Clients" Logo={Logo} />
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          paddingHorizontal: Spacings.sm,
          paddingBottom: Spacings.xl,
          paddingTop: Spacings.sm,
        }}
      >
        {title && (
          <TextBold mb="sm" size="lg">
            {title}
          </TextBold>
        )}
        <BasicInput
          mb="sm"
          icon={<SearchIcon ml="sm" color={Colors.NEUTRAL} />}
          value={search}
          placeholder="Search by name or HMIS ID"
          autoCorrect={false}
          onChangeText={onChange}
          onDelete={() => {
            setSearch('');
            setFilterSearch('');
            setOffset(0);
            setClients({});
          }}
        />
        {search && !loading && sections.length < 1 && (
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
        <SectionList
          style={{
            flex: 1,
          }}
          sections={sections}
          renderItem={({ item: clientProfile }) =>
            clients ? (
              <ClientCard
                imageUrl={clientProfile.profilePhoto?.url}
                arrivedFrom="/clients"
                select={select as string}
                id={clientProfile.id}
                onPress={() => {
                  if (select === 'true') {
                    createNoteFunction(
                      clientProfile.id,
                      clientProfile.user.firstName
                    );
                  } else {
                    setCurrentClient(clientProfile);
                    setModalIsOpen(true);
                  }
                }}
                mb="sm"
                firstName={clientProfile.user.firstName}
                lastName={clientProfile.user.lastName}
              />
            ) : null
          }
          renderSectionHeader={({ section: { title } }) => (
            <TextBold mb="xs" size="sm">
              {title}
            </TextBold>
          )}
          keyExtractor={(clientProfile) => clientProfile.id}
          onEndReached={loadMoreClients}
          onEndReachedThreshold={0.05}
          ListFooterComponent={renderFooter}
        />
      </View>
      <ClientCardModal
        isModalVisible={modalIsOpen}
        closeModal={() => setModalIsOpen(false)}
        client={currentClient}
      />
    </View>
  );
}
