import {
  reservationAddProfileSegment,
  reservationCheckInByDateSegment,
  reservationConfirmationSegment,
  reservationPathSegment,
  reservationSelectRoomSegment,
  reservationSelectShelterSegment,
  useUser,
} from '@monorepo/react/shelter';
import { Route, Routes } from 'react-router-dom';
import { OperatorLayout } from './components/layout/OperatorLayout';
import { ShelterDashboardPage } from './ShelterDashboardPage';
import { Dashboard } from './pages/dashboard/Dashboard';
import { CreateShelterForm } from './pages/dashboard/components/create-shelter-form';
import { AddProfilePage } from './pages/reservation/AddProfilePage';
import { CheckInByDate } from './pages/reservation/CheckInByDate';
import { ConfirmationPage } from './pages/reservation/ConfirmationPage';
import { ReservationPage } from './pages/reservation/ReservationPage';
import { SelectRoomPage } from './pages/reservation/SelectRoomPage';
import { SelectShelterPage } from './pages/reservation/SelectShelterPage';
import { SignIn } from './pages/signIn';
import { ActiveOrgProvider, OperatorAuthProvider } from './providers';

export function OperatorApp() {
  const { user } = useUser();

  return (
    <ActiveOrgProvider organizations={user?.organizations ?? []}>
      <OperatorAuthProvider>
        <Routes>
          <Route path="sign-in" element={<SignIn />} />
          <Route element={<OperatorLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard/create" element={<CreateShelterForm />} />
            <Route path="shelter/:id" element={<ShelterDashboardPage />} />
            <Route path={`${reservationPathSegment}/*`} element={<ReservationPage />}>
              <Route path={reservationAddProfileSegment} element={<AddProfilePage />} />
              <Route path={reservationSelectShelterSegment} element={<SelectShelterPage />} />
              <Route path={reservationSelectRoomSegment} element={<SelectRoomPage />} />
              <Route path={reservationCheckInByDateSegment} element={<CheckInByDate />} />
              <Route path={reservationConfirmationSegment} element={<ConfirmationPage />} />
            </Route>
            <Route
              path={`shelter/:shelterId/${reservationPathSegment}/*`}
              element={<ReservationPage />}
            >
              <Route path={reservationAddProfileSegment} element={<AddProfilePage />} />
              <Route path={reservationSelectRoomSegment} element={<SelectRoomPage />} />
              <Route path={reservationCheckInByDateSegment} element={<CheckInByDate />} />
              <Route path={reservationConfirmationSegment} element={<ConfirmationPage />} />
            </Route>
          </Route>
        </Routes>
      </OperatorAuthProvider>
    </ActiveOrgProvider>
  );
}
