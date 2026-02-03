import { Colors } from '@monorepo/expo/shared/static';
import { LoadingView, Tabs } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ClientProfileSectionEnum } from '../../screenRouting';
import { MainContainer } from '../../ui-components';
import { ClientViewTabEnum } from '../Client/ClientTabs';
import { HMISClientHeader } from './HMISClientHeader';
import { useGetHmisClientQuery } from './__generated__/getHMISClient.generated';
import { renderTabComponent } from './tabs/utils/renderTabComponent';

const hmisTabs: ClientViewTabEnum[] = [
  ClientViewTabEnum.Profile,
  ClientViewTabEnum.Interactions,
];

type TProps = {
  id: string;
  arrivedFrom?: string;
  openCard?: ClientProfileSectionEnum | null;
};

export function ClientHMIS(props: TProps) {
  const { id: personalId, openCard } = props;

  const { activeTab } = useLocalSearchParams<{
    activeTab?: ClientViewTabEnum;
  }>();

  const [currentTab, setCurrentTab] = useState(ClientViewTabEnum.Profile);

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const { data, loading } = useGetHmisClientQuery({
    variables: { personalId },
  });

  if (loading) {
    return <LoadingView />;
  }

  const client = data?.hmisGetClient;

  if (client?.__typename !== 'HmisClientType') {
    return null;
  }

  return (
    <MainContainer pt={0} pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT} px={0}>
      <HMISClientHeader client={client} />

      <Tabs
        tabs={hmisTabs}
        selectedTab={currentTab}
        onTabPress={setCurrentTab}
      />

      {renderTabComponent(currentTab, { client, openCard })}
    </MainContainer>
  );
}
