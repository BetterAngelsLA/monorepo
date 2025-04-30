import { RelationshipTypeEnum } from '../../../../../apollo';

export type TClientContactFormState = {
  relationshipToClient?: RelationshipTypeEnum;
  name?: string;
  email?: string;
  phoneNumber?: string;
  mailingAddress?: string;
  missingOneOfError?: string;
};
