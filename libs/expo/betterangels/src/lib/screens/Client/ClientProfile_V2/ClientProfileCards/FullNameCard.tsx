import { useRouter } from 'expo-router';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export function FullNameCard(props: TProps) {
  const { clientProfile } = props;
  const router = useRouter();

  const { firstName, middleName, lastName } = clientProfile?.user || {};
  const nickname = clientProfile?.nickname;

  const content: TClientProfileCardItem[] = [
    {
      header: ['First Name'],
      rows: [[firstName]],
    },
    {
      header: ['Middle Name'],
      rows: [[middleName]],
    },
    {
      header: ['Last Name'],
      rows: [[lastName]],
    },
    {
      header: ['Nickname'],
      rows: [[nickname]],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () =>
            router.push({
              pathname: `/clients/edit/${clientProfile?.id}`,
              params: {
                componentName: 'fullname',
              },
            }),
        }}
      />
    </ClientProfileCardContainer>
  );
}
