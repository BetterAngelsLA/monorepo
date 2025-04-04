import { ClientProfileSectionEnum } from './constants';

type TRoute = {
  pathname: string;
  params: {
    openCard?: ClientProfileSectionEnum;
  };
};

type TViewRouteProps = {
  id: string;
  openCard?: ClientProfileSectionEnum;
};

export function getClientProfileRoute(props: TViewRouteProps): TRoute {
  const { id, openCard } = props;

  return {
    pathname: `/client/${id}`,
    params: {
      openCard,
    },
  };
}
