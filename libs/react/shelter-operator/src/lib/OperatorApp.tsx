import { useUser } from '@monorepo/react/shelter';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CreateShelterProfile } from './components/ShelterProfile';
import { OperatorLayout } from './components/layout/OperatorLayout';
import { UsersPage } from './pages';
import { EditBedPage } from './pages/beds/EditBedPage';
import { CreateOrganizationPage } from './pages/createOrganization';
import { Dashboard } from './pages/dashboard/Dashboard';
import ShelterDashboardPage from './pages/dashboard/ShelterDashboardPage';
import { CreateShelterForm } from './pages/dashboard/components/create-shelter-form';
import { EditRoomPage } from './pages/rooms/EditRoomPage';
import {
  ShelterBasicInfoPage,
  ShelterDetailsPage,
  ShelterEcosystemPage,
  ShelterMediaPage,
  ShelterOperatingHoursPage,
  ShelterPoliciesPage,
  ShelterServicesPage,
} from './pages/shelterProfile';
import { SignIn } from './pages/signIn';
import { ActiveOrgProvider, OperatorAuthProvider } from './providers';
import {
  manageSegments,
  paths,
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
          <Route
            path={routePath(paths.createOrganization)}
            element={<CreateOrganizationPage />}
          />
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
              <Route
                path={shelterProfileSegments.media}
                element={<ShelterMediaPage />}
              />
            </Route>
            <Route path={routePath(paths.shelterManage)}>
              <Route index element={<ShelterDashboardPage tab="overview" />} />
              <Route
                path={manageSegments.roomsCreate}
                element={<EditRoomPage />}
              />
              <Route
                path={manageSegments.roomsEdit}
                element={<EditRoomPage />}
              />
              <Route
                path={manageSegments.rooms}
                element={<ShelterDashboardPage tab="rooms" />}
              />
              <Route
                path={manageSegments.bedsCreate}
                element={<EditBedPage />}
              />
              <Route path={manageSegments.bedsEdit} element={<EditBedPage />} />
              <Route
                path={manageSegments.beds}
                element={<ShelterDashboardPage tab="beds" />}
              />
              <Route
                path={manageSegments.occupancy}
                element={<ShelterDashboardPage tab="occupancy" />}
              />
              <Route
                path={manageSegments.reservations}
                element={<ShelterDashboardPage tab="reservations" />}
              />
            </Route>
          </Route>
        </Routes>
      </OperatorAuthProvider>
    </ActiveOrgProvider>
  );
}
