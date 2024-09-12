import { Colors } from '@monorepo/expo/shared/static';
import {
  Loading,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { ReactElement, useLayoutEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { MainContainer } from '../../ui-components';
import ClientHeader from './ClientHeader';
import ClientTabs from './ClientTabs';
import Docs from './Docs';
import Interactions from './Interactions';
import Locations from './Locations';
import Profile from './Profile';
import Schedule from './Schedule';
import Services from './Services';
import Tasks from './Tasks';
import { useClientProfileQuery } from './__generated__/Client.generated';

const getTabComponent = (
  key: string,
  userId: string | undefined
): ReactElement => {
  const components: {
    [key: string]: (props: { userId: string | undefined }) => JSX.Element;
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
  return <Component userId={userId} />;
};

export default function Client({
  id,
  arrivedFrom,
}: {
  id: string;
  arrivedFrom?: string;
}) {
  const { data, loading, error } = useClientProfileQuery({ variables: { id } });
  const [tab, setTab] = useState('Interactions');

  const navigation = useNavigation();
  const router = useRouter();

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

  if (error) throw new Error('Something went wrong. Please try again.');

  return (
    <MainContainer pt={0} pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT} px={0}>
      <ClientHeader
        age={data?.clientProfile.age}
        dateOfBirth={data?.clientProfile.dateOfBirth}
        firstName={data?.clientProfile.user.firstName}
        gender={data?.clientProfile.gender}
        lastName={data?.clientProfile.user.lastName}
        nickname={data?.clientProfile.nickname}
        preferredLanguage={data?.clientProfile.preferredLanguage}
      />
      <ClientTabs tab={tab} setTab={setTab} />
      {getTabComponent(tab, data?.clientProfile.user.id)}
    </MainContainer>
  );
}
