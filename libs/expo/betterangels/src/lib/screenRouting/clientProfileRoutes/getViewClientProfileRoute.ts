import { ClientProfileSectionEnum } from './constants';

type TRoute = {
  pathname: string;
  params: {
    openCard?: ClientProfileSectionEnum;
  };
};

type TProps = {
  id: string;
  openCard?: ClientProfileSectionEnum;
};

export function getViewClientProfileRoute(props: TProps): TRoute {
  const { id, openCard } = props;

  return {
    pathname: `/client/${id}`,
    params: {
      openCard,
    },
  };
}
