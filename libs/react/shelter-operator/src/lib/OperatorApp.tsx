import { useUser } from '@monorepo/react/shelter';
import { Route, Routes } from 'react-router-dom';
import { OperatorLayout } from './components/layout/OperatorLayout';
import ShelterDashboardPage from './ShelterDashboardPage';
import Dashboard from './pages/dashboard/Dashboard';
import CreateShelterForm from './pages/dashboard/components/create-shelter-form';
import SignIn from './pages/signIn';
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
          </Route>
        </Routes>
      </OperatorAuthProvider>
    </ActiveOrgProvider>
  );
}
