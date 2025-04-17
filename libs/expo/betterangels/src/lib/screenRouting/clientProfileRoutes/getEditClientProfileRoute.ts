import { TStandardSection } from './types';

type TGetRouteProps = {
  profileId: string;
  section: TStandardSection;
};

export function getEditClientProfileRoute(props: TGetRouteProps) {
  const { profileId, section } = props;

  return {
    pathname: `/clients/${profileId}/edit`,
    params: {
      componentName: section,
    },
  };
}
