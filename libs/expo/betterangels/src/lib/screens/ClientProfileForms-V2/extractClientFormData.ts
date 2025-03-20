import { GetClientProfileQuery } from '../AddEditClient/__generated__/AddEditClient.generated';
import { FormStateMapping, FullnameState, PersonalInfoState } from './types';

export const extractClientFormData = (
  formType: keyof FormStateMapping,
  clientProfile: GetClientProfileQuery['clientProfile']
): Partial<FormStateMapping[typeof formType]> => {
  switch (formType) {
    case 'fullname': {
      const { id, user, nickname } = clientProfile;
      return {
        id,
        user: {
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          id: user.id,
        },
        nickname,
      } as FullnameState;
    }
    case 'personalInfo': {
      const {
        id,
        dateOfBirth,
        californiaId,
        preferredLanguage,
        veteranStatus,
        livingSituation,
      } = clientProfile;

      return {
        id,
        dateOfBirth,
        californiaId,
        preferredLanguage,
        veteranStatus,
        livingSituation,
      } as PersonalInfoState;
    }
    case 'importantNotes': {
      const { id, importantNotes } = clientProfile;
      return {
        id,
        importantNotes,
      };
    }

    default:
      return {};
  }
};
