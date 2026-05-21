import { useQuery } from '@apollo/client/react';
import { useUser } from '@monorepo/react/shelter';
import { useLocation, useParams } from 'react-router-dom';
import { GetShelterNameDocument } from '../graphql/__generated__/shelters.generated';
import { paths } from '../routing';

export function useBreadcrumbs(): string[] {
  const location = useLocation();
  const params = useParams<{ shelterId?: string }>();
  const { user } = useUser();

  const shelterId = params.shelterId;
  const isShelterPage =
    !!shelterId && location.pathname.includes(`/shelter/${shelterId}`);

  const { data: shelterData } = useQuery(GetShelterNameDocument, {
    variables: { id: shelterId || '' },
    skip: !isShelterPage || !shelterId,
  });

  const isReservationPage = location.pathname.includes(paths.reservation);

  const organizationName = user?.organization?.name;
  const shelterName = shelterData?.shelter?.name;
  const pageTitle = isReservationPage ? 'Shelter Reservation' : undefined;

  return [organizationName, shelterName, pageTitle].filter(Boolean) as string[];
}
