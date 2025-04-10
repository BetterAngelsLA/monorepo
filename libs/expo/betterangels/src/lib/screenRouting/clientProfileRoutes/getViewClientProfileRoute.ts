import { ClientProfileSectionEnum } from './constants';

type TRoute = {
  pathname: string;
  params: {
    openCard: ClientProfileSectionEnum;
  };
};

type TProps = {
  id: string;
  openCard: ClientProfileSectionEnum;
};

// TODO: update to use `/clientProfiles/` root and then make params and openCard optional
export function getViewClientProfileRoute(props: TProps): TRoute {
  const { id, openCard } = props;

  return {
    pathname: `/client/${id}`,
    params: {
      openCard,
    },
  };
}
