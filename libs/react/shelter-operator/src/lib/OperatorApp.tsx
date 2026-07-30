import { ActiveOrgProvider } from '@monorepo/ba-platform';
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import { localStorageAdapter } from '@monorepo/react/shared';
import { useUser } from '@monorepo/react/shelter';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CreateShelterProfile } from './components/ShelterProfile';
import { OperatorLayout } from './components/layout/OperatorLayout';
import {
  BedsPage,
  CreateBedPage,
  CreateRoomPage,
  EditBedPage,
  EditRoomPage,
  OccupantsPage,
  ReportsPage,
  ReservationsPage,
  RoomsPage,
  UsersPage,
} from './pages';
import { CreateOrganizationPage } from './pages/createOrganization';
import { Dashboard } from './pages/dashboard/Dashboard';
import ShelterDashboardPage from './pages/dashboard/ShelterDashboardPage';
import { ReservationFormPage } from './pages/shelterManagement/ReservationFormPage';
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
import { OperatorAuthProvider } from './providers';
import {
  mgmtRouteConfig,
  paths,
  profileRouteConfig,
  routePath,
} from './routing';

export function OperatorApp() {
  const { user } = useUser();

  return (
    <ActiveOrgProvider
      storage={localStorageAdapter}
      organizations={(user?.organizations ?? []).map((org) => ({
        id: org.id,
        name: org.name,
        permissions: Object.values(org.permissions).flat() as PermissionEnum[],
      }))}
    >
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
              path={routePath(paths.shelterCreate)}
              element={<CreateShelterProfile />}
            />
            <Route path={routePath(profileRouteConfig.root)}>
              <Route
                index
                element={
                  <Navigate to={profileRouteConfig.children.basic} replace />
                }
              />
              <Route
                path={profileRouteConfig.children.basic}
                element={<ShelterBasicInfoPage />}
              />
              <Route
                path={profileRouteConfig.children.operatingHours}
                element={<ShelterOperatingHoursPage />}
              />
              <Route
                path={profileRouteConfig.children.policies}
                element={<ShelterPoliciesPage />}
              />
              <Route
                path={profileRouteConfig.children.details}
                element={<ShelterDetailsPage />}
              />
              <Route
                path={profileRouteConfig.children.services}
                element={<ShelterServicesPage />}
              />
              <Route
                path={profileRouteConfig.children.ecosystem}
                element={<ShelterEcosystemPage />}
              />
              <Route
                path={profileRouteConfig.children.media}
                element={<ShelterMediaPage />}
              />
            </Route>
            <Route path={routePath(mgmtRouteConfig.root)}>
              <Route index element={<ShelterDashboardPage tab="reports" />} />
              <Route
                index
                element={
                  <Navigate to={mgmtRouteConfig.children.beds} replace />
                }
              />
              <Route
                path={mgmtRouteConfig.children.beds}
                element={<BedsPage />}
              />
              <Route
                path={`${mgmtRouteConfig.children.beds}/${mgmtRouteConfig.actions.create}`}
                element={<CreateBedPage />}
              />
              <Route
                path={`${mgmtRouteConfig.children.beds}/${mgmtRouteConfig.actions.edit}`}
                element={<EditBedPage />}
              />
              <Route
                path={mgmtRouteConfig.children.rooms}
                element={<RoomsPage />}
              />
              <Route
                path={`${mgmtRouteConfig.children.rooms}/${mgmtRouteConfig.actions.create}`}
                element={<CreateRoomPage />}
              />
              <Route
                path={`${mgmtRouteConfig.children.rooms}/${mgmtRouteConfig.actions.edit}`}
                element={<EditRoomPage />}
              />
              <Route
                path={mgmtRouteConfig.children.reservations}
                element={<ReservationsPage />}
              />
              <Route
                path={`${mgmtRouteConfig.children.reservations}/${mgmtRouteConfig.actions.create}`}
                element={<ReservationFormPage />}
              />
              <Route
                path={`${mgmtRouteConfig.children.reservations}/${mgmtRouteConfig.actions.edit}`}
                element={<ReservationFormPage />}
              />
              <Route
                path={mgmtRouteConfig.children.occupants}
                element={<OccupantsPage />}
              />
              <Route
                path={mgmtRouteConfig.children.reports}
                element={<ReportsPage />}
              />
            </Route>
          </Route>
        </Routes>
      </OperatorAuthProvider>
    </ActiveOrgProvider>
  );
}
