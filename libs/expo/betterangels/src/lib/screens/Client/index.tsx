import { Colors } from '@monorepo/expo/shared/static';
import { Loading, TextRegular } from '@monorepo/expo/shared/ui-components';
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from 'expo-router';
import {
  ComponentType,
  ForwardRefExoticComponent,
  ReactElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { Pressable, View } from 'react-native';
import { ClientProfileSectionEnum } from '../../screenRouting';
import { MainContainer } from '../../ui-components';
import ClientHeader from './ClientHeader';
import { ClientNavMenu } from './ClientNavMenu/ClientNavMenu';
import ClientProfileView from './ClientProfile';
import ClientTabs, { ClientViewTabEnum } from './ClientTabs';
import Docs from './Docs';
import Interactions from './Interactions';
import { InteractionLocations as Locations } from './Locations';
import { useInteractionsMapState } from './Locations/map/hooks/useInteractionsMapState';
import {
  ClientProfileQuery,
  useClientProfileQuery,
} from './__generated__/Client.generated';

const getTabComponent = (
  key: ClientViewTabEnum,
  client: ClientProfileQuery | undefined,
  openCard?: ClientProfileSectionEnum
): ReactElement | null => {
  const components: {
    [key: string]: ForwardRefExoticComponent<any> | ComponentType<any>;
  } = {
    Docs,
    Interactions,
    Locations,
  };

  if (key === ClientViewTabEnum.Profile) {
    return <ClientProfileView client={client} openCard={openCard} />;
  }

  const Component = components[key];

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
  const { data, loading, error } = useClientProfileQuery({
    variables: { id: clientProfileId },
  });
  const [tab, setTab] = useState(ClientViewTabEnum.Profile);

  const navigation = useNavigation();
  const router = useRouter();
  const { newTab } = useLocalSearchParams<{ newTab?: ClientViewTabEnum }>();
  const { resetMapState } = useInteractionsMapState();

  useEffect(() => {
    if (newTab) {
      setTab(newTab);
    }
  }, [newTab]);

  // reset tab and mapState when navigating away from clientProfileId
  useFocusEffect(
    useCallback(() => {
      return () => {
        resetMapState();
        setTab(ClientViewTabEnum.Profile);
      };
    }, [clientProfileId])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Client  ${clientProfileId}`,
      headerLeft: () => (
        <Pressable
          accessibilityRole="button"
          accessible
          accessibilityHint="goes to previous screen"
          onPress={() =>
            arrivedFrom ? router.navigate(arrivedFrom) : router.navigate('/')
          }
        >
          <TextRegular color={Colors.WHITE}>Back</TextRegular>
        </Pressable>
      ),
      headerRight: () => <ClientNavMenu clientProfileId={clientProfileId} />,
    });
  }, [clientProfileId]);

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
