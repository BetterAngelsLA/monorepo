import { Colors } from '@monorepo/expo/shared/static';
import { LoadingView } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ClientProfileSectionEnum } from '../../screenRouting';
import { MainContainer } from '../../ui-components';
import { ClientViewTabEnum } from '../Client/ClientTabs';
import { HMISClientHeader } from './HMISClientHeader';
import { useGetHmisClientQuery } from './__generated__/getHMISClient.generated';
import { HMISClientTabs } from './tabs';

type TProps = {
  id: string;
  arrivedFrom?: string;
  openCard?: ClientProfileSectionEnum | null;
};

export function ClientHMIS(props: TProps) {
  const { id: personalId } = props;

  const [tab, setTab] = useState(ClientViewTabEnum.Profile);

  const { data, loading, error } = useGetHmisClientQuery({
    variables: { personalId },
  });

  console.log('');
  console.log('*****************  RESULT:', personalId);
  console.log(JSON.stringify(data, null, 2));

  console.log('');
  console.log('gql error');
  console.log(error);
  console.log('');

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
      <HMISClientTabs selectedTab={tab} setTab={setTab} />
      {/* {getTabComponent(tab, data, openCard)} */}
    </MainContainer>
  );
}

// ... on HmisGetClientError {
//       message
//       field
//     }
// const HmisGetClientError = {
//   errors: [
//     {
//       data: null,
//       errorInfo: null,
//       errorType: '404',
//       locations: [{ column: 3, line: 2, sourceName: null }],
//       message: {
//         name: 'Not Found',
//         message: 'Page not found.',
//         code: 0,
//         status: 404,
//       },
//       path: ['getClient'],
//     },
//     {
//       locations: null,
//       message:
//         "Cannot return null for non-nullable type: 'ID' within parent 'Client' (/getClient/personalId)",
//       path: ['getClient', 'personalId'],
//     },
//   ],
// };
