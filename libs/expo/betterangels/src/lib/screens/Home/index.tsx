import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  ClientCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Link, useRouter } from 'expo-router';
import { ElementType, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Events from './Events';
import Header from './Header';
import {
  ClientsQuery,
  useClientsQuery,
  useCreateNoteMutation,
} from './__generated__/ActiveClients.generated';

const paginationLimit = 20;

export default function Home({ Logo }: { Logo: ElementType }) {
  const [createNote] = useCreateNoteMutation();
  const [menu, setMenu] = useState<string | undefined>();
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [clients, setClients] = useState<ClientsQuery['clients']>([]);
  const { data, loading } = useClientsQuery({
    variables: {
      filters: { isActive: true },
      pagination: { limit: paginationLimit + 1, offset: offset },
    },
  });
  const router = useRouter();

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

  function loadMoreClients() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  const renderFooter = () => {
    return loading ? (
      <View style={{ marginTop: 10, alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    ) : null;
  };

  useEffect(() => {
    if (!data || !('clients' in data)) return;

    const clientsToShow = data.clients.slice(0, paginationLimit);
    const isMoreAvailable = data.clients.length > clientsToShow.length;

    if (offset === 0) {
      setClients(clientsToShow);
    } else {
      setClients((prevClients) => [...prevClients, ...clientsToShow]);
    }

    setHasMore(isMoreAvailable);
  }, [data, offset]);

  if (!data) return null;
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (menu) {
          setMenu(undefined);
        }
      }}
      accessibilityRole="button"
    >
      <View style={{ flex: 1 }}>
        <Header Logo={Logo} />
        <FlatList
          style={{
            flex: 1,
            backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
            paddingBottom: 80,
            paddingTop: Spacings.sm,
            paddingHorizontal: Spacings.sm,
          }}
          data={clients}
          ListHeaderComponent={
            <>
              <Events />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: Spacings.sm,
                }}
              >
                <TextMedium size="lg">Active Clients</TextMedium>
                <Link
                  accessible
                  accessibilityHint="goes to all active clients list"
                  accessibilityRole="button"
                  href="#"
                >
                  <TextRegular color={Colors.PRIMARY}>All Clients</TextRegular>
                </Link>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View onStartShouldSetResponder={() => true}>
              <ClientCard
                id={item.id}
                menu={menu}
                setMenu={setMenu}
                onPress={() => createNoteFunction(item.id, item.firstName)}
                mb="sm"
                firstName={item.firstName}
                lastName={item.lastName}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          onEndReached={loadMoreClients}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}
