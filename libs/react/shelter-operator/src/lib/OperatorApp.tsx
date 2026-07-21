import { ActiveOrgProvider } from '@monorepo/ba-platform';
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import { useUser } from '@monorepo/react/shelter';
import { localStorageAdapter } from '@monorepo/react/shared';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CreateShelterProfile } from './components/ShelterProfile';
import { OperatorLayout } from './components/layout/OperatorLayout';
import { UsersPage } from './pages';
import { EditBedPage } from './pages/beds/EditBedPage';
import { CreateOrganizationPage } from './pages/createOrganization';
import { Dashboard } from './pages/dashboard/Dashboard';
import ShelterDashboardPage from './pages/dashboard/ShelterDashboardPage';
import { ReservationFormPage } from './pages/reservations/ReservationFormPage';
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
import { OperatorAuthProvider } from './providers';
import {
  manageRouteConfig,
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
                element={<Navigate to={profileRouteConfig.children.basic} replace />}
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
            <Route path={routePath(manageRouteConfig.root)}>
              <Route index element={<ShelterDashboardPage tab="reports" />} />
              <Route
                path={`${manageRouteConfig.children.rooms}/${manageRouteConfig.actions.create}`}
                element={<EditRoomPage />}
              />
              <Route
                path={`${manageRouteConfig.children.rooms}/${manageRouteConfig.actions.edit}`}
                element={<EditRoomPage />}
              />
              <Route
                path={manageRouteConfig.children.rooms}
                element={<ShelterDashboardPage tab="rooms" />}
              />
              <Route
                path={`${manageRouteConfig.children.beds}/${manageRouteConfig.actions.create}`}
                element={<EditBedPage />}
              />
              <Route path={`${manageRouteConfig.children.beds}/${manageRouteConfig.actions.edit}`} element={<EditBedPage />} />
              <Route
                path={manageRouteConfig.children.beds}
                element={<ShelterDashboardPage tab="beds" />}
              />
              <Route
                path={`${manageRouteConfig.children.reservations}/${manageRouteConfig.actions.create}`}
                element={<ReservationFormPage />}
              />
              <Route
                path={`${manageRouteConfig.children.reservations}/${manageRouteConfig.actions.edit}`}
                element={<ReservationFormPage />}
              />
              <Route
                path={manageRouteConfig.children.occupants}
                element={<ShelterDashboardPage tab="occupants" />}
              />
              <Route
                path={manageRouteConfig.children.reservations}
                element={<ShelterDashboardPage tab="reservations" />}
              />
            </Route>
          </Route>
        </Routes>
      </OperatorAuthProvider>
    </ActiveOrgProvider>
  );
}
