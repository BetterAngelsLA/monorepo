import { TRelatedModelSection, TStandardSection } from './types';

type TGetRouteProps = {
  profileId: string;
  section: TStandardSection;
};

export function getClientProfileEditRoute(props: TGetRouteProps) {
  const { profileId, section } = props;

  return {
    pathname: `/clients/${profileId}/edit`,
    params: {
      componentName: section,
    },
  };
}

type TGetRelatedModelsViewRoute = {
  profileId: string;
  section: TRelatedModelSection;
};

export function getRelatedModelsViewRoute(props: TGetRelatedModelsViewRoute) {
  const { profileId, section } = props;

  return {
    pathname: `/clients/${profileId}/relations`,
    params: {
      componentName: section,
    },
  };
}

type TGetRelatedModelEditPathProps = {
  profileId: string;
  relatedlId: string;
  section: TRelatedModelSection;
};

export function getRelatedModelEditRoute(props: TGetRelatedModelEditPathProps) {
  const { profileId, relatedlId, section } = props;

  return {
    pathname: `/clients/${profileId}/relations/${relatedlId}/edit`,
    params: {
      componentName: section,
    },
  };
}

type TGetRelatedModelAddPathProps = {
  profileId: string;
  section: TRelatedModelSection;
};

export function getRelatedModelAddRoute(props: TGetRelatedModelAddPathProps) {
  const { profileId, section } = props;

  return {
    pathname: `/clients/${profileId}/relations/add`,
    params: {
      componentName: section,
    },
  };
}

// export function getClientProfileScreenRoute(props: TGetRouteProps): TRoute {
//   const { clientProfileId, hasData, section } = props;

//   let pathname = '';

//   switch (section) {
//     case ClientProfileSectionEnum.HmisIds:
//       pathname = getRelatedModelPath(clientProfileId, hasData);

//       break;
//     case ClientProfileSectionEnum.Household:
//       pathname = getRelatedModelPath(clientProfileId, hasData);

//       break;
//     case ClientProfileSectionEnum.RelevantContacts:
//       pathname = getRelatedModelPath(clientProfileId, hasData);

//       break;
//     default:
//       pathname = `/clients/${clientProfileId}/edit`;

//       break;
//   }

//   return {
//     pathname,
//     params: {
//       componentName: section,
//     },
//   };
// }

// function getRelatedModelPath(clientProfileId: string, hasData?: boolean) {
//   if (hasData) {
//     return `/clients/${clientProfileId}/relations`;
//   }

//   return `/clients/${clientProfileId}/relations/add`;
// }
