import { Colors } from '@monorepo/expo/shared/static';
import {
  Loading,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  ComponentType,
  ForwardRefExoticComponent,
  ReactElement,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Pressable, View } from 'react-native';
import { useFeatureFlagActive } from '../../hooks';
import { FeatureFlags } from '../../providers/featureControls/constants';
import { MainContainer } from '../../ui-components';
import ClientHeader from './ClientHeader';
import ClientProfileView from './ClientProfile_V2';
import ClientTabs from './ClientTabs';
import Docs from './Docs';
import Interactions from './Interactions';
import Locations from './Locations';
import Profile from './Profile';
import Schedule from './Schedule';
import Services from './Services';
import Tasks from './Tasks';
import {
  ClientProfileQuery,
  useClientProfileQuery,
} from './__generated__/Client.generated';
interface ProfileRef {
  scrollToRelevantContacts: () => void;
}

const getTabComponent = (
  key: string,
  client: ClientProfileQuery | undefined,
  clientRedesignFeatureOn: boolean,
  profileRef?: RefObject<ProfileRef>
): ReactElement | null => {
  const components: {
    [key: string]: ForwardRefExoticComponent<any> | ComponentType<any>;
  } = {
    Docs,
    Interactions,
    Locations,
    Profile,
    Schedule,
    Services,
    Tasks,
  };

  const Component = components[key];

  if (!Component) return null;

  if (key !== 'Profile') {
    return <Component client={client} />;
  }

  if (clientRedesignFeatureOn) {
    return <ClientProfileView client={client} />;
  }

  return <Profile ref={profileRef} client={client} />;
};

export default function Client({
  id,
  arrivedFrom,
}: {
  id: string;
  arrivedFrom?: string;
}) {
  const { data, loading, error } = useClientProfileQuery({ variables: { id } });
  const [tab, setTab] = useState('Profile');
  const clientRedesignFeatureOn = useFeatureFlagActive(
    FeatureFlags.PROFILE_REDESIGN_FF
  );

  const profileRef = useRef<ProfileRef | null>(null);

  const handleScrollToRelevantContacts = async () => {
    await setTab('Profile');
    profileRef.current?.scrollToRelevantContacts();
  };

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
      headerRight: () => (
        <TextButton
          regular
          color={Colors.WHITE}
          fontSize="md"
          accessibilityHint="goes to Edit screen"
          title="Edit"
          onPress={() => router.navigate(`/edit-client/${id}`)}
        />
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
      <ClientHeader
        onCaseManagerPress={handleScrollToRelevantContacts}
        client={data?.clientProfile}
      />
      <ClientTabs tab={tab} setTab={setTab} />
      {getTabComponent(tab, data, clientRedesignFeatureOn, profileRef)}
    </MainContainer>
  );
}
