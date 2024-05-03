import { SearchIcon, UserAddIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  ClientCard,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRouter } from 'expo-router';
import { ElementType, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, View } from 'react-native';
import { Header } from '../../ui-components';
import {
  ClientsQuery,
  useClientsQuery,
  useCreateNoteMutation,
} from './__generated__/Clients.generated';

const paginationLimit = 20;

interface IGroupedClients {
  [key: string]: {
    title: string;
    data: ClientsQuery['clients'];
  };
}

export default function Clients({ Logo }: { Logo: ElementType }) {
  const [search, setSearch] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [createNote] = useCreateNoteMutation();
  const [menu, setMenu] = useState<string | undefined>();
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { data, loading } = useClientsQuery({
    variables: {
      pagination: { limit: paginationLimit + 1, offset },
      filters: {
        search: filterSearch,
      },
    },
  });
  const [clients, setClients] = useState<IGroupedClients>();

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
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    ) : null;
  };

  const debounceSearch = useMemo(
    () =>
      debounce((text) => {
        setFilterSearch(text);
      }, 500),
    []
  );

  const onChange = useCallback(
    (e: string) => {
      setSearch(e);
      debounceSearch(e);
    },
    [debounceSearch]
  );

  useEffect(() => {
    if (!data || !('clients' in data)) return;

    const clientsToShow = data.clients
      .slice(0, paginationLimit)
      .sort((a, b) => a.firstName?.localeCompare(b.firstName || '') || 0);
    const isMoreAvailable = data.clients.length > clientsToShow.length;

    const groupedContacts = clientsToShow.reduce(
      (acc: IGroupedClients, client) => {
        const firstLetter = client.firstName?.[0].toUpperCase();
        if (firstLetter && !acc[firstLetter]) {
          acc[firstLetter] = {
            title: firstLetter,
            data: [],
          };
        }
        firstLetter && acc[firstLetter].data.push(client);
        return acc;
      },
      {}
    );
    if (offset === 0) {
      setClients(groupedContacts);
    } else {
      setClients((prevClients) => ({ ...prevClients, ...groupedContacts }));
    }

    setHasMore(isMoreAvailable);
  }, [data, offset]);

  const sections = Object.values(clients || {});

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
        <BasicInput
          mb="sm"
          icon={<SearchIcon ml="sm" color={Colors.NEUTRAL} />}
          value={search}
          onChangeText={onChange}
          onDelete={() => {
            setSearch('');
            setFilterSearch('');
          }}
        />
        <SectionList
          style={{
            flex: 1,
          }}
          sections={sections}
          renderItem={({ item }) =>
            data ? (
              <ClientCard
                id={item.id}
                menu={menu}
                setMenu={setMenu}
                onPress={() => createNoteFunction(item.id, item.firstName)}
                mb="sm"
                firstName={item.firstName}
                lastName={item.lastName}
              />
            ) : null
          }
          renderSectionHeader={({ section: { title } }) => (
            <TextBold mb="xs" size="sm">
              {title}
            </TextBold>
          )}
          keyExtractor={(item) => item.id}
          onEndReached={loadMoreClients}
          onEndReachedThreshold={0.5}
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
