import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
import ShelterDashboardPage from './ShelterDashboardPage'

export function OperatorApp() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/shelter/:id" element={<ShelterDashboardPage />} />
    </Routes>
  );
}
