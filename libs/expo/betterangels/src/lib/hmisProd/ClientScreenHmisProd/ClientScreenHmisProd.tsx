import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  InfiniteList,
  SearchBar,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ElementType, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSignOut } from '../../hooks';
import { pagePaddingHorizontal } from '../../static';
import {
  ClientCardHmis,
  Header,
  HorizontalContainer,
} from '../../ui-components';
import { clientSearchItemToHmisClientProfileType } from '../adapters';
import { isAuthErrorHmisProd } from '../api';
import { DebugRow } from '../components';
import { useSearchClientsHmisProd } from '../hooks';
import { ClientScreenHmisProdError } from './ClientScreenHmisProdError';

const SEARCH_ERROR_TITLE = 'HMIS search failed';

/**
 * Entry screen for the HMIS prod feature (experimental).
 *
 * Rendered by the clients tab when `FeatureFlags.HMIS_PROD_DEMO` is active.
 * Feature-private: nothing else under `lib/hmisProd` is exported publicly.
 *
 * Searches clients directly against HMIS (`/api1/clients/long`) via
 * `useSearchClientsHmisProd`; tapping a result opens the feature's own
 * read-only `ClientHmisProd` detail screen. With `HMIS_PROD_DEMO_DEBUG_MODE` on, a
 * "Debug Info" row offers the request URL, status, and auth context for
 * copy/paste — the raw response body is included only for failures, since
 * successful search responses contain client data. Auth failures (401/403)
 * additionally offer a "Log in again" action that signs out cleanly so the
 * user can re-authenticate.
 */

export function ClientScreenHmisProd({ Logo }: { Logo: ElementType }) {
  const [search, setSearch] = useState('');

  const router = useRouter();

  const { signOut } = useSignOut();

  const {
    data,
    debugInfo,
    error,
    isFetching,
    isError,
    isRefetching,
    isSuccess,
    refetch,
  } = useSearchClientsHmisProd(search);

  const errorMessage = error instanceof Error ? error.message : undefined;
  const isAuthError = isAuthErrorHmisProd(error);

  const clients = useMemo(
    () => (data?.items ?? []).map(clientSearchItemToHmisClientProfileType),
    [data],
  );

  const handleClientPress = useCallback(
    (id: string) => {
      router.navigate({
        pathname: `/hmis-prod-client/${id}`,
        params: { arrivedFrom: '/' },
      });
    },
    [router],
  );

  const hasSearched = isFetching || isSuccess || isError;

  return (
    <View style={styles.container} testID="hmis-prod-clients-screen">
      <Header title="HMIS Clients" Logo={Logo} />

      <View style={styles.content}>
        <HorizontalContainer>
          <SearchBar
            value={search}
            placeholder="Search name, HMIS ID"
            testID="hmis-prod-clients-search-input"
            autoCapitalize="none"
            onChange={(text) => setSearch(text)}
            onClear={() => setSearch('')}
            style={{ marginBottom: Spacings.xs }}
          />
        </HorizontalContainer>

        <DebugRow debugInfo={debugInfo} />

        {!hasSearched && (
          <View style={styles.searchHint}>
            <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
              Type at least 2 characters to search HMIS clients.
            </TextRegular>
          </View>
        )}

        {hasSearched && (
          <InfiniteList
            modelName="client"
            data={clients}
            keyExtractor={(client) => client.id}
            totalItems={data?._meta?.total_count ?? clients.length}
            renderResultsHeader={clients.length > 0 ? undefined : null}
            renderItem={(client) => (
              <ClientCardHmis
                client={client}
                onPress={() => handleClientPress(client.id)}
              />
            )}
            loading={isFetching}
            error={isError}
            errorTitle={SEARCH_ERROR_TITLE}
            errorMessage={errorMessage}
            ErrorViewComponent={
              isAuthError ? (
                <ClientScreenHmisProdError
                  title={SEARCH_ERROR_TITLE}
                  bodyText={errorMessage}
                  onLogInAgain={signOut}
                />
              ) : null
            }
            refreshing={isRefetching}
            onRefresh={refetch}
            hasMore={false}
            ListEmptyComponent={
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                No clients found.
              </TextRegular>
            }
            style={{ paddingHorizontal: pagePaddingHorizontal }}
          />
        )}
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
  searchHint: {
    paddingHorizontal: pagePaddingHorizontal,
  },
});
