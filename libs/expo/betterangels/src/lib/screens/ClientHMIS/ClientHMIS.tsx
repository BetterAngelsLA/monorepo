import { CombinedGraphQLErrors } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Colors } from '@monorepo/expo/shared/static';
import { LoadingView, Tabs } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

  const { activeTab } = useLocalSearchParams<{
    activeTab?: ClientViewTabEnum;
  }>();

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
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

  if (CombinedGraphQLErrors.is(error)) {
    const graphQLError = error.errors[0];

    console.error(`[ClientHMIS] error for client id [${id}]:`, graphQLError);

    const { message } = graphQLError;

    // TODO: check for code and not string.
    if (message.startsWith('The requested Object does not exist')) {
      showSnackbar({
        message: 'Sorry, this client profile is no longer available..',
        type: 'error',
      });

      router.dismissTo(arrivedFrom || '/');

      return null;
    }
  }

  const client = data?.hmisClientProfile;

  if (client?.__typename !== 'HmisClientProfileType') {
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
