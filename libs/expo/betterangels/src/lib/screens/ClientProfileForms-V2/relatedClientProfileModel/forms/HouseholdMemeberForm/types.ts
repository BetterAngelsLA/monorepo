import { GenderEnum, RelationshipTypeEnum } from '../../../../../apollo';

export type THouseholdMemberFormState = {
  name?: string;
  gender?: GenderEnum;
  dateOfBirth?: Date | null;
  relationshipToClient?: RelationshipTypeEnum;
};

// title={
//     relationshipToClient &&
//     clientHouseholdMemberEnumDisplay[relationshipToClient]
//   }

// const content: TClientProfileCardItem[] = [
//     {
//       header: ['Name'],
//       rows: [[name]],
//     },
//     {
//       header: ['Gender'],
//       rows: [[displayGender]],
//     },
//     {
//       header: ['Date of Birth'],
//       rows: [[formattedDob]],
//     },
//   ];
