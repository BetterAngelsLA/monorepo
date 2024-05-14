import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { ReactElement, useState } from 'react';
import { MainScrollContainer } from '../../ui-components';
import ClientHeader from './ClientHeader';
import ClientTabs from './ClientTabs';
import Docs from './Docs';
import Interactions from './Interactions';
import Profile from './Profile';
import Services from './Services';
import Tasks from './Tasks';
import { useClientProfileQuery } from './__generated__/Client.generated';

const getTabComponent = (key: string, id: string): ReactElement => {
  const components: { [key: string]: (props: { id: string }) => JSX.Element } =
    {
      Profile,
      Interactions,
      Tasks,
      Services,
      Docs,
    };

  const Component = components[key];
  return <Component id={id} />;
};

export default function Client({ id }: { id: string }) {
  const { data, loading, error } = useClientProfileQuery({ variables: { id } });
  const [tab, setTab] = useState('Profile');

  if (loading) return <TextRegular>Loading</TextRegular>;

  if (error) throw new Error('Something went wrong. Please try again.');

  return (
    <MainScrollContainer pt={0} bg={Colors.NEUTRAL_EXTRA_LIGHT} px={0}>
      <ClientHeader
        firstName={data?.clientProfile.user.firstName}
        lastName={data?.clientProfile.user.lastName}
      />
      <ClientTabs tab={tab} setTab={setTab} />
      {getTabComponent(tab, id)}
    </MainScrollContainer>
  );
}
