import {
  TClientProfile,
  TClientProfileHouseholdMemeber,
} from '../../../../Client/ClientProfile_V2/types';
import { THouseholdMemberFormState } from './types';

export const defaultFormState: THouseholdMemberFormState = {
  name: '',
  gender: undefined,
  dateOfBirth: null,
  relationshipToClient: undefined,
};

const hello: TClientProfileHouseholdMemeber | null = null;

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

// {
//     "__typename": "ClientHouseholdMemberType",
//     "dateOfBirth": null,
//     "gender": null,
//     "genderOther": null,
//     "id": "3",
//     "name": "",
//     "relationshipToClient": "AUNT",
//     "relationshipToClientOther": null
// }

export function toFormState(props: TProps): THouseholdMemberFormState {
  const { clientProfile, relationId } = props;

  if (!relationId) {
    return defaultFormState;
  }

  const householdMember = clientProfile?.householdMembers?.find(
    (member) => member.id === relationId
  );

  const { name, gender, dateOfBirth, relationshipToClient } =
    householdMember || {};

  return {
    name: name || '',
    gender: gender || undefined,
    dateOfBirth,
    relationshipToClient: relationshipToClient || undefined,
  };
}
