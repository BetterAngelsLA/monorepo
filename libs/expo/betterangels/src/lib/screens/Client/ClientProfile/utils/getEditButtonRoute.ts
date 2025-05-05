import {
  ClientProfileSectionEnum,
  TRelatedModelSection,
  TStandardSection,
  getEditClientProfileRoute,
  getRelatedModelAddRoute,
  getRelatedModelViewRoute,
} from '../../../../screenRouting';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile: TClientProfile;
  section: ClientProfileSectionEnum;
};

export function getEditButtonRoute(props: TProps) {
  const { clientProfile, section } = props;

  switch (section) {
    case ClientProfileSectionEnum.HmisIds:
    case ClientProfileSectionEnum.Household:
    case ClientProfileSectionEnum.RelevantContacts:
      if (hasSectionModelData(section, clientProfile)) {
        return getRelatedModelViewRoute({
          profileId: clientProfile.id,
          section: section as TRelatedModelSection,
        });
      }

      return getRelatedModelAddRoute({
        profileId: clientProfile.id,
        section: section as TRelatedModelSection,
      });
    default:
      return getEditClientProfileRoute({
        profileId: clientProfile.id,
        section: section as TStandardSection,
      });
  }
}

function hasSectionModelData(
  section: ClientProfileSectionEnum,
  clientProfile: TClientProfile
): boolean {
  const { hmisProfiles, householdMembers, contacts } = clientProfile;

  switch (section) {
    case ClientProfileSectionEnum.HmisIds:
      return !!hmisProfiles?.length;

    case ClientProfileSectionEnum.Household:
      return !!householdMembers?.length;

    case ClientProfileSectionEnum.RelevantContacts:
      return !!contacts?.length;

    default:
      return false;
  }
}
