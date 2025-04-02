import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { THmisProfileFormInputs, defaultFormState } from './HmisProfileForm';

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function toHmisFormEntity(props: TProps): THmisProfileFormInputs {
  const { clientProfile, relationId } = props;

  if (!relationId) {
    return defaultFormState;
  }

  const hmisProfile = clientProfile?.hmisProfiles?.find(
    (profile) => profile.id === relationId
  );

  const { agency, hmisId } = hmisProfile || {};

  return {
    hmisId: hmisId || '',
    agency: agency || '',
  };
}
