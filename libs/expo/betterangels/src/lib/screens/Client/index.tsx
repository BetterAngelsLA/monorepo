import { Colors } from '@monorepo/expo/shared/static';
import { Loading, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  ComponentType,
  ForwardRefExoticComponent,
  ReactElement,
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
import ClientTabs from './ClientTabs';
import Docs from './Docs';
import Interactions from './Interactions';
import {
  ClientProfileQuery,
  useClientProfileQuery,
} from './__generated__/Client.generated';
const getTabComponent = (
  key: string,
  client: ClientProfileQuery | undefined,
  openCard?: ClientProfileSectionEnum
): ReactElement | null => {
  const components: {
    [key: string]: ForwardRefExoticComponent<any> | ComponentType<any>;
  } = {
    Docs,
    Interactions,
  };

  if (key === 'Profile') {
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
  const [tab, setTab] = useState('Profile');

  const navigation = useNavigation();
  const router = useRouter();
  const { newTab } = useLocalSearchParams<{ newTab?: string }>();

  useEffect(() => {
    if (newTab) {
      setTab(newTab);
    }
  }, [newTab]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Client',
      headerLeft: () => (
        <Pressable
          accessibilityRole="button"
          accessible
          accessibilityHint="goes to previous screen"
          onPress={() =>
            arrivedFrom ? router.navigate(arrivedFrom) : router.back()
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

  if (error)
    throw new Error(`Something went wrong. Please try again. ${error}`);

  return (
    <MainContainer pt={0} pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT} px={0}>
      <ClientHeader client={data?.clientProfile} />
      <ClientTabs tab={tab} setTab={setTab} />
      {getTabComponent(tab, data, openCard)}
    </MainContainer>
  );
}
