import { useQuery } from '@apollo/client/react';
import { operatorPath, reservationPathSegment, useUser } from '@monorepo/react/shelter';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { NavBar } from '../NavBar';
import { GetShelterNameDocument } from '../../graphql/__generated__/shelters.generated';

export function OperatorLayout() {
  const location = useLocation();
  const params = useParams<{ id?: string; shelterId?: string }>();
  const { user } = useUser();
  const isDashboardPage =
    location.pathname === operatorPath || location.pathname === `${operatorPath}/`;

  const shelterId = params.shelterId || params.id;
  const isShelterPage =
    !!shelterId && location.pathname.includes(`/shelter/${shelterId}`);

  const { data: shelterData } = useQuery(GetShelterNameDocument, {
    variables: { id: shelterId || '' },
    skip: !isShelterPage || !shelterId,
  });

  const isReservationPage = location.pathname.includes(`/${reservationPathSegment}`);
  const organizationName = user?.organization?.name;
  const shelterName = shelterData?.shelter?.name;
  const pageTitle = isReservationPage ? 'Shelter Reservation' : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar
        showCreateButton={isDashboardPage}
        organizationName={organizationName}
        shelterName={shelterName}
        pageTitle={pageTitle}
      />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
