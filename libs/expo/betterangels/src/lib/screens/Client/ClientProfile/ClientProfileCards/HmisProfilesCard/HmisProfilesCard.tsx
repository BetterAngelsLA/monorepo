import { ClientProfileCardContainer } from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { EmptyState } from './EmptyState';
import { HmisProfileCard } from './HmisProfileCard';

type TProps = {
  clientProfile?: TClientProfile;
};

export function HmisProfilesCard(props: TProps) {
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
        return <HmisProfileCard key={idx} hmisProfile={hmisProfile} />;
      })}
    </ClientProfileCardContainer>
  );
}
