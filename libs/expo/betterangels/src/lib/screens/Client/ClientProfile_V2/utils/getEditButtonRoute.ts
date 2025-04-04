import {
  TRelatedModelSection,
  TStandardSection,
  getClientProfileEditRoute,
  getRelatedModelAddRoute,
  getRelatedModelsViewRoute,
} from '../../../../screenRouting';
import { ClientProfileCardEnum } from '../constants';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile: TClientProfile;
  section: ClientProfileCardEnum;
};

export function getEditButtonRoute(props: TProps) {
  const { clientProfile, section } = props;

  switch (section) {
    case ClientProfileCardEnum.HmisIds:
    case ClientProfileCardEnum.Household:
    case ClientProfileCardEnum.RelevantContacts:
      const hasData = hasSectionModelData(section, clientProfile);

      if (hasData) {
        return getRelatedModelsViewRoute({
          profileId: clientProfile.id,
          section: section as unknown as TRelatedModelSection,
        });
      }

      return getRelatedModelAddRoute({
        profileId: clientProfile.id,
        section: section as unknown as TRelatedModelSection,
      });
    default:
      return getClientProfileEditRoute({
        profileId: clientProfile.id,
        section: section as unknown as TStandardSection,
      });
  }
}

function hasSectionModelData(
  section: ClientProfileCardEnum,
  clientProfile: TClientProfile
): boolean {
  const { hmisProfiles, householdMembers, contacts } = clientProfile;

  switch (section) {
    case ClientProfileCardEnum.HmisIds:
      return !!hmisProfiles?.length;

    case ClientProfileCardEnum.Household:
      return !!householdMembers?.length;

    case ClientProfileCardEnum.RelevantContacts:
      return !!contacts?.length;

    default:
      return false;
  }
}
