import { GenderEnum, RelationshipTypeEnum } from '../../../../../apollo';

export type THouseholdMemberFormState = {
  name?: string;
  gender?: GenderEnum;
  dateOfBirth?: Date | null;
  relationshipToClient?: RelationshipTypeEnum;
};
