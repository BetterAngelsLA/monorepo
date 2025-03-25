import { parseToDate } from '@monorepo/expo/shared/ui-components';
import { GetClientProfileQuery } from '../AddEditClient/__generated__/AddEditClient.generated';
import { ClientProfileCardEnum } from '../Client/ClientProfile_V2/constants';
import { FormStateMapping } from './types';

export const extractClientFormData = (
  formType: keyof FormStateMapping,
  clientProfile: GetClientProfileQuery['clientProfile']
): Partial<FormStateMapping[typeof formType]> => {
  switch (formType) {
    case ClientProfileCardEnum.FullName: {
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
      };
    }
    case ClientProfileCardEnum.PersonalInfo: {
      const {
        id,
        dateOfBirth,
        californiaId,
        preferredLanguage,
        veteranStatus,
        livingSituation,
        profilePhoto,
      } = clientProfile;

      let dobAsDate: Date | null | undefined;

      if (dateOfBirth) {
        dobAsDate = parseToDate({
          date: dateOfBirth,
          inputFormat: 'yyyy-MM-dd',
        });
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
    case ClientProfileCardEnum.ImportantNotes: {
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
