import { ClientProfileCardContainer } from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { EmptyState } from './EmptyState';
import { ProfileCardHmis } from './ProfileCardHmis';

type TProps = {
  clientProfile?: TClientProfile;
};

export function ProfilesCardHmis(props: TProps) {
  const { clientProfile } = props;

  const { hmisProfiles } = clientProfile || {};

  if (!hmisProfiles?.length) {
    return (
      <ClientProfileCardContainer>
        <EmptyState />
      </ClientProfileCardContainer>
    );
  }

  return (
    <ClientProfileCardContainer>
      {hmisProfiles.map((hmisProfile, idx) => {
        return <ProfileCardHmis key={idx} hmisProfile={hmisProfile} />;
      })}
    </ClientProfileCardContainer>
  );
}
