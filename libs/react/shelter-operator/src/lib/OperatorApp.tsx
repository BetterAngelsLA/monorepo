import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
import OperatorDashboardLayout from './pages/dashboard/OperatorDashboardLayout';
import ShelterDashboardPage from './pages/dashboard/ShelterDashboardPage';
import CreateShelterForm from './pages/dashboard/components/create-shelter-form';
import SignIn from './pages/signIn';
import { OperatorAuthProvider } from './providers';

export function OperatorApp() {
  return (
    <OperatorAuthProvider>
      <Routes>
        <Route element={<OperatorDashboardLayout />}>
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
  );
}
