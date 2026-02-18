import { Route, Routes } from 'react-router-dom';
import ShelterDashboardPage from './ShelterDashboardPage';
import Dashboard from './pages/dashboard/Dashboard';
import CreateShelterForm from './pages/dashboard/components/create-shelter-form';
import SignIn from './pages/signIn';

export function OperatorApp() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="dashboard/create" element={<CreateShelterForm />} />
      <Route path="shelter/:id" element={<ShelterDashboardPage />} />
      <Route path="sign-in" element={<SignIn />} />
    </Routes>
  );
}
