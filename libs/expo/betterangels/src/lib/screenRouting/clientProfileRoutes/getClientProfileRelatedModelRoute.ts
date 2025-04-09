import { TRelatedModelSection } from './types';

type TGetRelatedModelsViewRoute = {
  profileId: string;
  section: TRelatedModelSection;
};

export function getRelatedModelViewRoute(props: TGetRelatedModelsViewRoute) {
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
