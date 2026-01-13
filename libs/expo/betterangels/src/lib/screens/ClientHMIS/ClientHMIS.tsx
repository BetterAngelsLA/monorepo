import { useQuery } from '@apollo/client/react';
import { API_ERROR_CODES } from '@monorepo/expo/shared/clients';
import { Colors } from '@monorepo/expo/shared/static';
import { LoadingView, Tabs } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { hasGqlCombinedApiError } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { ClientProfileSectionEnum } from '../../screenRouting';
import { MainContainer } from '../../ui-components';
import { ClientViewTabEnum } from '../Client/ClientTabs';
import { HMISClientProfileHeader } from './HMISClientProfileHeader';
import { HmisClientProfileDocument } from './__generated__/getHMISClient.generated';
import { renderTabComponent } from './tabs/utils/renderTabComponent';

const hmisTabs: ClientViewTabEnum[] = [
  ClientViewTabEnum.Profile,
  ClientViewTabEnum.Interactions,
  ClientViewTabEnum.Locations,
  ClientViewTabEnum.Tasks,
];

type TProps = {
  id: string;
  arrivedFrom?: string;
  openCard?: ClientProfileSectionEnum | null;
};

export function ClientHMIS(props: TProps) {
  const { id, arrivedFrom, openCard } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { activeTab } = useLocalSearchParams<{
    activeTab?: ClientViewTabEnum;
  }>();
  const [currentTab, setCurrentTab] = useState(ClientViewTabEnum.Profile);

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const { data, loading, error } = useQuery(HmisClientProfileDocument, {
    variables: { id },
  });

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    console.error(`[ClientHMIS] error for client id [${id}]:`, error);
  }

  const client = data?.hmisClientProfile;

  if (client?.__typename !== 'HmisClientProfileType') {
    const hasClientNotFoundError = hasGqlCombinedApiError(
      API_ERROR_CODES.NOT_FOUND,
      error
    );

    const message = hasClientNotFoundError
      ? 'Sorry, this client profile is no longer available.'
      : 'Sorry, something went wrong.';

    showSnackbar({
      message,
      type: 'error',
    });

    router.dismissTo(arrivedFrom || '/');

    return null;
  }

  const showHeader = currentTab !== ClientViewTabEnum.Locations;

  return (
    <MainContainer pt={0} pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT} px={0}>
      {showHeader && <HMISClientProfileHeader client={client} />}

      <Tabs
        tabs={hmisTabs}
        selectedTab={currentTab}
        onTabPress={setCurrentTab}
      />

      {renderTabComponent(currentTab, { client, openCard })}
    </MainContainer>
  );
}
