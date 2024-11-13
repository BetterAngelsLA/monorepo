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

import { UserAddOutlineIcon } from '@monorepo/expo/shared/icons';
import { ClientProfileType } from '../../apollo';
import { ClientCard, ClientCardModal, Header } from '../../ui-components';
import {
  ClientProfilesQuery,
  useClientProfilesQuery,
} from './__generated__/ActiveClients.generated';

const paginationLimit = 20;

export default function Home({ Logo }: { Logo: ElementType }) {
  const [currentClient, setCurrentClient] = useState<ClientProfileType>();
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [clients, setClients] = useState<ClientProfilesQuery['clientProfiles']>(
    []
  );
  const { data, loading } = useClientProfilesQuery({
    variables: {
      filters: { isActive: true },
      pagination: { limit: paginationLimit + 1, offset: offset },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const router = useRouter();

  function loadMoreClients() {
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
    if (!data || !('clientProfiles' in data)) return;

    const clientsToShow = data.clientProfiles.slice(0, paginationLimit);
    const isMoreAvailable = data.clientProfiles.length > clientsToShow.length;

    if (offset === 0) {
      setClients(clientsToShow);
    } else {
      setClients((prevClients) => [...prevClients, ...clientsToShow]);
    }

    setHasMore(isMoreAvailable);
  }, [data, offset]);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Home" Logo={Logo} />

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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: Spacings.sm,
              }}
            >
              <TextMedium size="lg">Active Clients</TextMedium>
              <TextButton
                accessibilityHint="goes to all active clients list"
                color={Colors.PRIMARY}
                fontSize="sm"
                regular={true}
                title="All Clients"
                onPress={() => router.navigate('/clients')}
              />
            </View>
            {!loading && clients.length < 1 && (
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
            )}
          </>
        }
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
