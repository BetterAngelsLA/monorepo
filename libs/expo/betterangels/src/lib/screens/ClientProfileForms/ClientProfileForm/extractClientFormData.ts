import { parseToDate } from '@monorepo/expo/shared/ui-components';
import { SocialMediaEnum } from '../../../apollo';
import { ClientProfileSectionEnum } from '../../../screenRouting';
import { GetClientProfileQuery } from './__generated__/clientProfile.generated';
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
    case ClientProfileSectionEnum.FullName: {
      const { id, firstName, lastName, middleName, nickname } = clientProfile;
      return {
        id,
        firstName,
        lastName,
        middleName,
        nickname,
      };
    }
    case ClientProfileSectionEnum.PersonalInfo: {
      const {
        id,
        californiaId,
        dateOfBirth,
        livingSituation,
        preferredLanguage,
        profilePhoto,
        veteranStatus,
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
        californiaId,
        dateOfBirth: dobAsDate,
        livingSituation,
        preferredLanguage,
        profilePhoto,
        veteranStatus,
      };
    }
    case ClientProfileSectionEnum.ImportantNotes: {
      const { id, importantNotes } = clientProfile;
      return {
        id,
        importantNotes,
      };
    }
    case ClientProfileSectionEnum.ContactInfo: {
      const {
        id,
        email,
        mailingAddress,
        phoneNumbers,
        preferredCommunication,
        residenceAddress,
        socialMediaProfiles,
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
        email,
        mailingAddress,
        phoneNumbers: updatedPhoneNumbers,
        preferredCommunication,
        residenceAddress,
        socialMediaProfiles: updatedSocialMediaProfiles,
      };
    }
    case ClientProfileSectionEnum.Demographic: {
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
