import { SearchIcon, UserAddIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  ClientCard,
  Loading,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ElementType, useEffect, useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import { Ordering } from '../../apollo';
import { Header } from '../../ui-components';
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
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [clients, setClients] = useState<IGroupedClients>({});

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
      const response = await createNote({
        variables: {
          data: {
            title: `Session with ${firstName || 'Client'}`,
            client: id,
          },
        },
      });
      if (response.data?.createNote && 'id' in response.data.createNote) {
        router.navigate(`/add-note/${response.data?.createNote.id}`);
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
          onChangeText={onChange}
          onDelete={() => {
            setSearch('');
            setFilterSearch('');
            setOffset(0);
            setClients({});
          }}
        />
        <SectionList
          style={{
            flex: 1,
          }}
          sections={sections}
          renderItem={({ item: clientProfile }) =>
            clients ? (
              <ClientCard
                select={select as string}
                id={clientProfile.id}
                onPress={() =>
                  createNoteFunction(
                    clientProfile.user.id,
                    clientProfile.user.firstName
                  )
                }
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
        <Button
          height="xl"
          icon={<UserAddIcon size="md" color={Colors.PRIMARY} />}
          title="Add Client"
          size="auto"
          variant="secondary"
          accessibilityHint="adding new client"
        />
      </View>
    </View>
  );
}
