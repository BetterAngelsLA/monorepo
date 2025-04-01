import { ClientProfileCardEnum } from './constants';
import { TClientProfile } from './types';

type TRouteConfig = {
  pathname: string;
  params: { componentName: ClientProfileCardEnum };
};

type TGetRouteConfig = {
  clientProfile: TClientProfile;
  section: ClientProfileCardEnum;
};

export function getClientProfileRouteConfig(
  props: TGetRouteConfig
): TRouteConfig | null {
  const { clientProfile, section } = props;

  if (!clientProfile) {
    return null;
  }

  const {
    id: profileId,
    hmisProfiles,
    householdMembers,
    contacts,
  } = clientProfile;

  let pathname = '';

  switch (section) {
    case ClientProfileCardEnum.HmisIds:
      pathname = getRelatedModelPath(profileId, !!hmisProfiles?.length);

      break;
    case ClientProfileCardEnum.Household:
      pathname = getRelatedModelPath(profileId, !!householdMembers?.length);

      break;
    case ClientProfileCardEnum.RelevantContacts:
      pathname = getRelatedModelPath(profileId, !!contacts?.length);

      break;
    default:
      pathname = `/clients/${profileId}/edit`;

      break;
  }

  return {
    pathname,
    params: {
      componentName: section,
    },
  };
}

function getRelatedModelPath(clientProfileId: string, hasData?: boolean) {
  const rootPath = `/clients/${clientProfileId}/relations`;

  if (hasData) {
    return rootPath;
  }

  return `${rootPath}/add`;
}
