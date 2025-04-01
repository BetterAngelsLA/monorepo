import { ClientProfileCardEnum } from './constants';
import { TClientProfile } from './types';

type TRouteConfig = {
  pathname: string;
  params: { componentName: ClientProfileCardEnum };
};

const defaultRouteConfig: Partial<
  Record<ClientProfileCardEnum, { componentName: ClientProfileCardEnum }>
> = {
  [ClientProfileCardEnum.FullName]: {
    componentName: ClientProfileCardEnum.FullName,
  },
  [ClientProfileCardEnum.PersonalInfo]: {
    componentName: ClientProfileCardEnum.PersonalInfo,
  },
  [ClientProfileCardEnum.ImportantNotes]: {
    componentName: ClientProfileCardEnum.ImportantNotes,
  },
  [ClientProfileCardEnum.ContactInfo]: {
    componentName: ClientProfileCardEnum.ContactInfo,
  },
};

type TGetRouteConfig = {
  clientProfile: TClientProfile;
  section: ClientProfileCardEnum;
};

export function getRouteConfig(props: TGetRouteConfig): TRouteConfig | null {
  const { clientProfile, section } = props;

  if (!clientProfile) {
    return null;
  }

  const { id: clientProfileId, hmisProfiles } = clientProfile;

  if (section === ClientProfileCardEnum.HmisIds) {
    const hasData = !!hmisProfiles?.length;

    const hmisPath = hasData
      ? `/clients/${clientProfileId}/relations`
      : `/clients/${clientProfileId}/relations/add`;

    return {
      pathname: hmisPath,
      params: {
        componentName: ClientProfileCardEnum.HmisIds,
      },
    };
  }

  const config = defaultRouteConfig[section];

  if (!config) {
    return null;
  }

  return {
    pathname: `/clients/edit/${clientProfileId}`,
    params: {
      componentName: config.componentName,
    },
  };
}
