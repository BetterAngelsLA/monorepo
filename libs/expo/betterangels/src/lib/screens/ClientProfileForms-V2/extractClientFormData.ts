import { parse } from 'date-fns';
import { GetClientProfileQuery } from '../AddEditClient/__generated__/AddEditClient.generated';
import { FormStateMapping, FullnameState } from './types';

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
        profilePhoto,
      } = clientProfile;

      let dobAsDate: Date | undefined;

      if (dateOfBirth) {
        dobAsDate = parse(dateOfBirth, 'yyyy-MM-dd', new Date());
      }

      return {
        id,
        dateOfBirth: dobAsDate,
        californiaId,
        preferredLanguage,
        veteranStatus,
        livingSituation,
        profilePhoto,
      };
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
