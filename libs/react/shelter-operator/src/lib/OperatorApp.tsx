import { useUser } from '@monorepo/react/shelter';
import { Route, Routes } from 'react-router-dom';
import { OperatorLayout } from './components/layout/OperatorLayout';
import Dashboard from './pages/dashboard/Dashboard';
import ShelterDashboardPage from './pages/dashboard/ShelterDashboardPage';
import CreateShelterForm from './pages/dashboard/components/create-shelter-form';
import SignIn from './pages/signIn';
import { ActiveOrgProvider, OperatorAuthProvider } from './providers';

export function OperatorApp() {
  const { user } = useUser();

  return (
    <ActiveOrgProvider organizations={user?.organizations ?? []}>
      <OperatorAuthProvider>
        <Routes>
          <Route element={<OperatorLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard/create" element={<CreateShelterForm />} />
            <Route
              path="shelter/:id"
              element={<ShelterDashboardPage tab={'overview'} />}
            />
            <Route
              path="shelter/:id/rooms"
              element={<ShelterDashboardPage tab={'rooms'} />}
            />
            <Route
              path="shelter/:id/beds"
              element={<ShelterDashboardPage tab={'beds'} />}
            />
            <Route
              path="shelter/:id/occupancy"
              element={<ShelterDashboardPage tab={'occupancy'} />}
            />
            <Route
              path="shelter/:id/label"
              element={<ShelterDashboardPage tab={'label'} />}
            />
          </Route>
          <Route path="sign-in" element={<SignIn />} />
        </Routes>
      </OperatorAuthProvider>
    </ActiveOrgProvider>
  );
}
