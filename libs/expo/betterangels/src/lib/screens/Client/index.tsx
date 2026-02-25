import { Colors } from '@monorepo/expo/shared/static';
import { Loading, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  ComponentType,
  ReactElement,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { Pressable, View } from 'react-native';
import { ClientProfileSectionEnum } from '../../screenRouting';
import { MainContainer } from '../../ui-components';
import { ClientHeader } from './ClientHeader';
import { ClientNavMenu } from './ClientNavMenu/ClientNavMenu';
import ClientProfileView from './ClientProfile';
import ClientTabs, { ClientViewTabEnum } from './ClientTabs';
import Docs from './Docs';
import Interactions from './Interactions';
import { InteractionLocations } from './Locations';
import { TasksTab } from './Tasks';

import { useQuery } from '@apollo/client/react';
import {
  ClientProfileDocument,
  ClientProfileQuery,
} from './__generated__/Client.generated';

type TabComponentProps = {
  client?: ClientProfileQuery;
};

const tabComponents: Record<
  ClientViewTabEnum,
  ComponentType<TabComponentProps>
> = {
  [ClientViewTabEnum.Profile]: () => null, // handled specially below
  [ClientViewTabEnum.Docs]: Docs as ComponentType<TabComponentProps>,
  [ClientViewTabEnum.Interactions]:
    Interactions as ComponentType<TabComponentProps>,
  [ClientViewTabEnum.Locations]: ({ client }) => (
    <InteractionLocations clientProfileId={client?.clientProfile.id} />
  ),
  [ClientViewTabEnum.Tasks]: TasksTab as ComponentType<TabComponentProps>,
};

const getTabComponent = (
  key: ClientViewTabEnum,
  client: ClientProfileQuery | undefined,
  openCard?: ClientProfileSectionEnum
): ReactElement | null => {
  if (key === ClientViewTabEnum.Profile) {
    return <ClientProfileView client={client} openCard={openCard} />;
  }

  const Component = tabComponents[key];

  if (!Component) {
    return null;
  }

  return <Component client={client} />;
};

export default function Client({
  id: clientProfileId,
  arrivedFrom,
  openCard,
}: {
  id: string;
  arrivedFrom?: string;
  openCard?: ClientProfileSectionEnum;
}) {
  const { data, loading, error } = useQuery<ClientProfileQuery>(
    ClientProfileDocument,
    {
      variables: { id: clientProfileId },
    }
  );

  const [tab, setTab] = useState<ClientViewTabEnum>(ClientViewTabEnum.Profile);

  const navigation = useNavigation();
  const router = useRouter();
  const { newTab } = useLocalSearchParams<{ newTab?: ClientViewTabEnum }>();

  useEffect(() => {
    if (newTab) {
      setTab(newTab);
    }
  }, [newTab]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          accessibilityRole="button"
          accessible
          accessibilityHint="goes to previous screen"
          onPress={() => router.dismissTo(arrivedFrom || '/')}
        >
          <TextRegular color={Colors.WHITE}>Back</TextRegular>
        </Pressable>
      ),
      headerRight: () => (
        <ClientNavMenu
          clientProfileId={clientProfileId}
          onDeleted={() => {
            router.dismissTo(arrivedFrom || '/');
          }}
        />
      ),
    });
  }, [clientProfileId, arrivedFrom, navigation, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
        }}
      >
        <Loading size="large" />
      </View>
    );
  }

  if (error) {
    throw new Error(`Something went wrong. Please try again. ${error}`);
  }

  const showHeader = tab !== ClientViewTabEnum.Locations;

  return (
    <MainContainer pt={0} pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT} px={0}>
      {showHeader && <ClientHeader client={data?.clientProfile} />}
      <ClientTabs selectedTab={tab} setTab={setTab} />
      {getTabComponent(tab, data, openCard)}
    </MainContainer>
  );
}
