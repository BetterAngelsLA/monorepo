import { Colors } from '@monorepo/expo/shared/static';
import {
  LoadingView,
  Tabs,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSnackbar } from '../../hooks';
import { ClientViewTabEnum } from '../../screens/Client/ClientTabs';
import { ClientProfileHeaderHmis } from '../../screens/ClientHmis/ClientProfileHeaderHmis';
import { MainContainer } from '../../ui-components';
import { clientDetailToHmisClientProfileType } from '../adapters';
import { ErrorHmisProd } from '../api';
import { DebugRow } from '../components';
import { useClientHmisProd } from '../hooks';
import { ClientProfileViewHmisProd } from './ClientProfileViewHmisProd';

// v1: Profile only — more tabs land here once prod equivalents exist.
const tabsHmisProd: ClientViewTabEnum[] = [ClientViewTabEnum.Profile];

type TProps = {
  id: string;
  arrivedFrom?: string;
};

/**
 * Detail screen for the HMIS prod feature (experimental).
 *
 * Reads the client straight from Clarity (`useClientHmisProd`) instead of the
 * BA GraphQL backend, so the profile is read-only: edit routes and the photo
 * uploader are GraphQL-backed and stay off. With
 * `HMIS_PROD_DEMO_DEBUG_MODE` on, a "Debug Info" row offers the request URL,
 * status, and raw response for copy/paste.
 *
 * Feature-private: rendered by the `hmis-prod-client/[id]` route, which only
 * the hmisProd demo flow navigates to.
 */
export function ClientHmisProd(props: TProps) {
  const { id, arrivedFrom } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const { data: detail, debugInfo, isLoading, error } = useClientHmisProd(id);

  const [currentTab, setCurrentTab] = useState(ClientViewTabEnum.Profile);

  // Note: useEffect for showSnackbar and router to avoid render side effects
  // (same pattern as ClientHmis).
  useEffect(() => {
    if (!error) {
      return;
    }

    const isClientNotFound =
      error instanceof ErrorHmisProd && error.status === 404;

    const message = isClientNotFound
      ? 'Sorry, this client profile is no longer available.'
      : 'Sorry, something went wrong.';

    showSnackbar({ message, type: 'error' });
    router.dismissTo(arrivedFrom || '/');
  }, [error, router, showSnackbar, arrivedFrom]);

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    console.error(`[ClientHmisProd] error for client id [${id}]:`, error);

    return null;
  }

  if (!detail) {
    return null;
  }

  const client = clientDetailToHmisClientProfileType(detail);

  const screenTitle =
    client.firstName || client.lastName
      ? `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim()
      : 'Client';

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <TextBold
              color={Colors.WHITE}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ maxWidth: 200 }}
            >
              {screenTitle}
            </TextBold>
          ),
        }}
      />
      <MainContainer pt={0} pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT} px={0}>
        <ClientProfileHeaderHmis client={client} allowPhotoUpload={false} />

        <Tabs
          tabs={tabsHmisProd}
          selectedTab={currentTab}
          onTabPress={setCurrentTab}
        />

        <DebugRow
          debugInfo={debugInfo}
          testID="hmis-prod-client-copy-debug-info"
        />

        {currentTab === ClientViewTabEnum.Profile && (
          <ClientProfileViewHmisProd client={client} />
        )}
      </MainContainer>
    </>
  );
}
