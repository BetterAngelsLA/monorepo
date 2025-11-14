import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
import ShelterDashboardPage from './ShelterDashboardPage';
import SignIn from './pages/signIn';

export function OperatorApp() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/shelter/:id" element={<ShelterDashboardPage />} />
      <Route path="sign-in" element={<SignIn />} />
    </Routes>
  );
}
