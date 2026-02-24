import { TClientProfile } from '../../../../Client/ClientProfile/types';
import { TProfileFormStateHmis } from './types';

export const defaultFormState: TProfileFormStateHmis = {
  hmisId: '',
  agency: undefined,
};

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function toFormState(props: TProps): TProfileFormStateHmis {
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
