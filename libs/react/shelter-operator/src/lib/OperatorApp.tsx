import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
<<<<<<< HEAD
=======
import ShelterDashboardPage from './ShelterDashboardPage'
>>>>>>> origin/uw-blueprint

export function OperatorApp() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
<<<<<<< HEAD
=======
      <Route path="/shelter/:id" element={<ShelterDashboardPage />} />
>>>>>>> origin/uw-blueprint
    </Routes>
  );
}
