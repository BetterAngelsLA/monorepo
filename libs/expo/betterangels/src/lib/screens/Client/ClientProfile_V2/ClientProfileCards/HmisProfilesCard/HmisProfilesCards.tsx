import { ClientProfileCardContainer } from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { EmptyState } from './EmptyState';
import { HmisProfilesCard } from './HmisProfilesCard';

type TProps = {
  clientProfile?: TClientProfile;
};

export function HmisProfilesCards(props: TProps) {
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
        return <HmisProfilesCard key={idx} hmisProfile={hmisProfile} />;
      })}
    </ClientProfileCardContainer>
  );
}
