import { useQuery } from '@apollo/client/react';
import { Colors } from '@monorepo/expo/shared/static';
import { LoadingView, Tabs } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
  const { id, openCard } = props;

  const { activeTab } = useLocalSearchParams<{
    activeTab?: ClientViewTabEnum;
  }>();

  const [currentTab, setCurrentTab] = useState(ClientViewTabEnum.Profile);

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const { data, loading } = useQuery(HmisClientProfileDocument, {
    variables: { id },
  });

  if (loading) {
    return <LoadingView />;
  }

  const client = data?.hmisClientProfile;

  if (client?.__typename !== 'HmisClientProfileType') {
    return null;
  }

  const showHeader = currentTab !== ClientViewTabEnum.Locations;

  return (
    <MainContainer pt={0} pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT} px={0}>
      <HMISClientProfileHeader client={client} />

      <Tabs
        tabs={hmisTabs}
        selectedTab={currentTab}
        onTabPress={setCurrentTab}
      />

      {renderTabComponent(currentTab, { client, openCard })}
    </MainContainer>
  );
}
