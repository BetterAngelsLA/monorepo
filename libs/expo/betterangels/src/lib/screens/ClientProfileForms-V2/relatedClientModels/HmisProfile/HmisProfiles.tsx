import { HmisProfileCard } from '../../../Client/ClientProfile_V2/ClientProfileCards/HmisProfilesCard/HmisProfileCard';
import { TClientProfile } from '../../../Client/ClientProfile_V2/types';

type TProps = {
  clientProfile?: TClientProfile;
};

export function HmisProfiles(props: TProps) {
  const { clientProfile } = props;

  const { hmisProfiles } = clientProfile || {};

  if (!hmisProfiles?.length) {
    return null;
  }

  return (
    <>
      {hmisProfiles.map((hmisProfile, idx) => {
        return <HmisProfileCard key={idx} hmisProfile={hmisProfile} />;
      })}
    </>
  );
}
