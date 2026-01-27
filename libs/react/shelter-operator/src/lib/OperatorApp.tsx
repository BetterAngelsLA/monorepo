import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';

export function OperatorApp() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}
