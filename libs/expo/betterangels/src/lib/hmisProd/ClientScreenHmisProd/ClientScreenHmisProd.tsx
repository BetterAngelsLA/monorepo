import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CopyButton,
  InfiniteList,
  SearchBar,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { ElementType, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSignOut } from '../../hooks';
import { FeatureFlags, pagePaddingHorizontal } from '../../static';
import {
  ClientCardHmis,
  Header,
  HorizontalContainer,
} from '../../ui-components';
import { clientSearchItemToHmisClientProfileType } from '../adapters';
import { isAuthErrorHmisProd } from '../api';
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
 * `useSearchClientsHmisProd`. With `HMIS_PROD_DEMO_DEBUG_MODE` on, a
 * "Debug Info" row offers the request URL, auth context, and raw response
 * for copy/paste. Auth failures (401/403) additionally offer a "Log in
 * again" action that signs out cleanly so the user can re-authenticate.
 */

export function ClientScreenHmisProd({ Logo }: { Logo: ElementType }) {
  const [search, setSearch] = useState('');

  const { signOut } = useSignOut();

  const debugModeEnabled = useFeatureFlagActive(
    FeatureFlags.HMIS_PROD_DEMO_DEBUG_MODE,
  );

  const { data, debugInfo, error, isFetching, isError, isRefetching, refetch } =
    useSearchClientsHmisProd(search);

  const errorMessage = error instanceof Error ? error.message : undefined;
  const isAuthError = isAuthErrorHmisProd(error);

  const clients = useMemo(
    () => (data?.items ?? []).map(clientSearchItemToHmisClientProfileType),
    [data],
  );

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

        {debugModeEnabled && (
          <View style={styles.debugRow}>
            <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
              Debug Info
            </TextRegular>
            <CopyButton
              textToCopy={debugInfo ? JSON.stringify(debugInfo, null, 2) : null}
              testID="hmis-prod-copy-debug-info"
            />
          </View>
        )}

        <InfiniteList
          modelName="client"
          data={clients}
          keyExtractor={(client) => client.id}
          totalItems={data?._meta?.total_count ?? clients.length}
          renderItem={(client) => <ClientCardHmis client={client} />}
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
              {search.trim().length <= 1
                ? 'Type at least 2 characters to search HMIS clients.'
                : 'No clients found.'}
            </TextRegular>
          }
          style={{ paddingHorizontal: pagePaddingHorizontal }}
        />
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
  debugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingHorizontal: pagePaddingHorizontal,
    marginBottom: Spacings.xs,
  },
});
