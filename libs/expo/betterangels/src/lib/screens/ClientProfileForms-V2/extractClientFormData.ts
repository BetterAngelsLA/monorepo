import { parseToDate } from '@monorepo/expo/shared/ui-components';
import { SocialMediaEnum } from '../../apollo';
import { GetClientProfileQuery } from '../AddEditClient/__generated__/AddEditClient.generated';
import { ClientProfileCardEnum } from '../Client/ClientProfile_V2/constants';
import { FormStateMapping, TPhoneNumber } from './types';

const defaultSocialMedias = [
  {
    platform: SocialMediaEnum.Facebook,
    platformUserId: '',
  },
  {
    platform: SocialMediaEnum.Instagram,
    platformUserId: '',
  },
  {
    platform: SocialMediaEnum.Linkedin,
    platformUserId: '',
  },
  {
    platform: SocialMediaEnum.Tiktok,
    platformUserId: '',
  },
];

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
    case ClientProfileCardEnum.ContactInfo: {
      const {
        id,
        residenceAddress,
        mailingAddress,
        socialMediaProfiles,
        preferredCommunication,
        phoneNumbers,
        user,
      } = clientProfile;

      let updatedPhoneNumbers: TPhoneNumber[] = [
        { number: '', isPrimary: false },
      ];

      if (phoneNumbers?.length) {
        updatedPhoneNumbers = phoneNumbers.map((item) => {
          const { __typename, ...rest } = item;

          return rest;
        });
      }

      const updatedSocialMediaProfiles = defaultSocialMedias.map(
        (defaultProfile) => {
          const existingProfile = socialMediaProfiles?.find(
            (profile) => profile.platform === defaultProfile.platform
          );

          if (existingProfile) {
            const { __typename, ...cleanedProfile } = existingProfile;
            return cleanedProfile;
          }

          return defaultProfile;
        }
      );

      return {
        id,
        residenceAddress,
        mailingAddress,
        user: {
          id: user.id,
          email: user.email,
        },
        socialMediaProfiles: updatedSocialMediaProfiles,
        preferredCommunication,
        phoneNumbers: updatedPhoneNumbers,
      };
    }
    case ClientProfileCardEnum.Demographic: {
      const {
        id,
        gender,
        pronouns,
        race,
        placeOfBirth,
        heightInInches,
        eyeColor,
        hairColor,
        maritalStatus,
        physicalDescription,
        adaAccommodation,
      } = clientProfile;

      return {
        id,
        gender,
        pronouns,
        race,
        placeOfBirth,
        heightInInches,
        eyeColor,
        hairColor,
        maritalStatus,
        physicalDescription,
        adaAccommodation,
      };
    }

    default:
      return {};
  }
};
