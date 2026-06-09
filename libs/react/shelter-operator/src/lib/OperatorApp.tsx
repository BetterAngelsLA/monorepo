import { useUser } from '@monorepo/react/shelter';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CreateShelterProfile } from './components/ShelterProfile';
import { OperatorLayout } from './components/layout/OperatorLayout';
import { UsersPage } from './pages';
import { Dashboard } from './pages/dashboard/Dashboard';
import ShelterDashboardPage from './pages/dashboard/ShelterDashboardPage';
import { CreateShelterForm } from './pages/dashboard/components/create-shelter-form';
import { ShelterReportPage } from './pages/report/ShelterReportPage';
import { AddProfilePage } from './pages/reservation/AddProfilePage';
import { CheckInByDate } from './pages/reservation/CheckInByDate';
import { ConfirmationPage } from './pages/reservation/ConfirmationPage';
import { ReservationPage } from './pages/reservation/ReservationPage';
import { SelectRoomPage } from './pages/reservation/SelectRoomPage';
import { SelectShelterPage } from './pages/reservation/SelectShelterPage';
import {
  ShelterBasicInfoPage,
  ShelterDetailsPage,
  ShelterEcosystemPage,
  ShelterOperatingHoursPage,
  ShelterPoliciesPage,
  ShelterServicesPage,
} from './pages/shelterProfile';
import { SignIn } from './pages/signIn';
import { ActiveOrgProvider, OperatorAuthProvider } from './providers';
import {
  manageSegments,
  paths,
  reservationSegments,
  routePath,
  shelterProfileSegments,
} from './routing';

export function OperatorApp() {
  const { user } = useUser();

  return (
    <ActiveOrgProvider organizations={user?.organizations ?? []}>
      <OperatorAuthProvider>
        <Routes>
          <Route path={routePath(paths.signIn)} element={<SignIn />} />
          <Route element={<OperatorLayout />}>
            <Route index element={<Dashboard />} />
            <Route path={routePath(paths.users)} element={<UsersPage />} />
            <Route
              path={routePath(paths.dashboardCreate)}
              element={<CreateShelterForm />}
            />
            <Route
              path={routePath(paths.shelterCreate)}
              element={<CreateShelterProfile />}
            />
            <Route path={routePath(paths.shelterProfile)}>
              <Route
                index
                element={<Navigate to={shelterProfileSegments.basic} replace />}
              />
              <Route
                path={shelterProfileSegments.basic}
                element={<ShelterBasicInfoPage />}
              />
              <Route
                path={shelterProfileSegments.operatingHours}
                element={<ShelterOperatingHoursPage />}
              />
              <Route
                path={shelterProfileSegments.policies}
                element={<ShelterPoliciesPage />}
              />
              <Route
                path={shelterProfileSegments.details}
                element={<ShelterDetailsPage />}
              />
              <Route
                path={shelterProfileSegments.services}
                element={<ShelterServicesPage />}
              />
              <Route
                path={shelterProfileSegments.ecosystem}
                element={<ShelterEcosystemPage />}
              />
            </Route>
            <Route
              path={routePath(paths.shelterReport)}
              element={<ShelterReportPage />}
            />
            <Route path={routePath(paths.shelterManage)}>
              <Route index element={<ShelterDashboardPage tab="overview" />} />
              <Route
                path={manageSegments.rooms}
                element={<ShelterDashboardPage tab="rooms" />}
              />
              <Route
                path={manageSegments.beds}
                element={<ShelterDashboardPage tab="beds" />}
              />
              <Route
                path={manageSegments.occupancy}
                element={<ShelterDashboardPage tab="occupancy" />}
              />
              <Route
                path={manageSegments.label}
                element={<ShelterDashboardPage tab="label" />}
              />
            </Route>
            <Route
              path={`${routePath(paths.reservation)}/*`}
              element={<ReservationPage />}
            >
              <Route
                path={reservationSegments.addProfile}
                element={<AddProfilePage />}
              />
              <Route
                path={reservationSegments.selectShelter}
                element={<SelectShelterPage />}
              />
              <Route
                path={reservationSegments.selectRoom}
                element={<SelectRoomPage />}
              />
              <Route
                path={reservationSegments.checkInByDate}
                element={<CheckInByDate />}
              />
              <Route
                path={reservationSegments.confirmation}
                element={<ConfirmationPage />}
              />
            </Route>
            <Route
              path={`${routePath(paths.shelterReservation)}/*`}
              element={<ReservationPage />}
            >
              <Route
                path={reservationSegments.addProfile}
                element={<AddProfilePage />}
              />
              <Route
                path={reservationSegments.selectRoom}
                element={<SelectRoomPage />}
              />
              <Route
                path={reservationSegments.checkInByDate}
                element={<CheckInByDate />}
              />
              <Route
                path={reservationSegments.confirmation}
                element={<ConfirmationPage />}
              />
            </Route>
          </Route>
        </Routes>
      </OperatorAuthProvider>
    </ActiveOrgProvider>
  );
}
