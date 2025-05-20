import { TClientProfile } from '../../../../Client/ClientProfile/types';
import { THmisProfileFormState } from './types';

export const defaultFormState: THmisProfileFormState = {
  hmisId: '',
  agency: undefined,
};

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function toFormState(props: TProps): THmisProfileFormState {
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
    agency: agency || undefined,
  };
}
