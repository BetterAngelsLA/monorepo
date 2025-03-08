import { ClientProfileCardContainer } from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { EmptyState } from './EmptyState';
import { HmisProfile } from './HmisProfile';

type TProps = {
  clientProfile?: TClientProfile;
};

export function HmisProfiles(props: TProps) {
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
        return <HmisProfile key={idx} hmisProfile={hmisProfile} />;
      })}
    </ClientProfileCardContainer>
  );
}
