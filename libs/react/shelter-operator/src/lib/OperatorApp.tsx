import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
import SignIn from './pages/signIn';

export function OperatorApp() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="sign-in" element={<SignIn />} />
    </Routes>
  );
}
