import { Colors } from '@monorepo/expo/shared/static';
import { Loading } from '@monorepo/expo/shared/ui-components';
import { ReactElement, useState } from 'react';
import { View } from 'react-native';
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
    Profile,
    Interactions,
    Tasks,
    Services,
    Docs,
    Schedule,
    Locations,
  };

  const Component = components[key];
  return <Component userId={userId} />;
};

export default function Client({ id }: { id: string }) {
  const { data, loading, error } = useClientProfileQuery({ variables: { id } });
  const [tab, setTab] = useState('Interactions');

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
        firstName={data?.clientProfile.user.firstName}
        lastName={data?.clientProfile.user.lastName}
        gender={data?.clientProfile.gender}
        dateOfBirth={data?.clientProfile.dateOfBirth}
        preferredLanguage={data?.clientProfile.preferredLanguage}
        age={data?.clientProfile.age}
      />
      <ClientTabs tab={tab} setTab={setTab} />
      {getTabComponent(tab, data?.clientProfile.user.id)}
    </MainContainer>
  );
}
