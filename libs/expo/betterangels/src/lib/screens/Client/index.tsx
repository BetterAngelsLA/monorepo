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
import { validateAsEnum } from '../../helpers/validateAsEnum';
import { ClientProfileSectionEnum } from '../../screenRouting';
import { MainContainer } from '../../ui-components';
import ClientHeader from './ClientHeader';
import ClientProfileView from './ClientProfile';
import ClientTabs, { ClientTabEnum } from './ClientTabs';
import Docs from './Docs';
import Interactions from './Interactions';
import {
  ClientProfileQuery,
  useClientProfileQuery,
} from './__generated__/Client.generated';

const tabComponentMap: Partial<Record<ClientTabEnum, ComponentType<any>>> = {
  [ClientTabEnum.Docs]: Docs,
  [ClientTabEnum.Interactions]: Interactions,
};

const getTabComponent = (
  tabKey: ClientTabEnum,
  client: ClientProfileQuery | undefined,
  openCard?: ClientProfileSectionEnum
): ReactElement | null => {
  if (tabKey === ClientTabEnum.Profile) {
    return <ClientProfileView client={client} openCard={openCard} />;
  }

  const Component = tabComponentMap[tabKey];

  if (!Component) {
    return null;
  }

  return <Component client={client} />;
};

export default function Client({
  id,
  arrivedFrom,
  openCard,
}: {
  id: string;
  arrivedFrom?: string;
  openCard?: ClientProfileSectionEnum;
}) {
  const { data, loading, error } = useClientProfileQuery({ variables: { id } });
  const [tab, setTab] = useState<ClientTabEnum>(ClientTabEnum.Profile);

  const navigation = useNavigation();
  const router = useRouter();
  const { newTab } = useLocalSearchParams<{ newTab?: string }>();

  const isValidTab = validateAsEnum(newTab, ClientTabEnum);

  useEffect(() => {
    if (isValidTab) {
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
          onPress={() =>
            arrivedFrom ? router.navigate(arrivedFrom) : router.navigate('/')
          }
        >
          <TextRegular color={Colors.WHITE}>Back</TextRegular>
        </Pressable>
      ),
    });
  }, []);

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
