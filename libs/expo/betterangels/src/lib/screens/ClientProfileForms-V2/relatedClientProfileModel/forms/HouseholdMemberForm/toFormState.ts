import { parseToDate } from '@monorepo/expo/shared/ui-components';
import { TClientProfile } from '../../../../Client/ClientProfile/types';
import { THouseholdMemberFormState } from './types';

export const defaultFormState: THouseholdMemberFormState = {
  name: '',
  gender: undefined,
  dateOfBirth: null,
  relationshipToClient: undefined,
};

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

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

  const dobAsDate = parseToDate({
    date: dateOfBirth,
    inputFormat: 'yyyy-MM-dd',
  });

  return {
    name: name || '',
    gender: gender || undefined,
    dateOfBirth: dobAsDate,
    relationshipToClient: relationshipToClient || undefined,
  };
}
