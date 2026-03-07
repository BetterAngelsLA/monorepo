import { Route, Routes } from 'react-router-dom';
import ShelterDashboardPage from './ShelterDashboardPage';
import Dashboard from './pages/dashboard/Dashboard';
import CreateShelterForm from './pages/dashboard/components/create-shelter-form';
import { AddProfilePage } from './pages/reservation/AddProfilePage';
import { ConfirmationPage } from './pages/reservation/ConfirmationPage';
import { ReservationPage } from './pages/reservation/ReservationPage';
import { SelectRoomPage } from './pages/reservation/SelectRoomPage';
import { SelectShelterPage } from './pages/reservation/SelectShelterPage';
import SignIn from './pages/signIn';
import { OperatorAuthProvider } from './providers';

export function OperatorApp() {
  return (
    <OperatorAuthProvider>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="dashboard/create" element={<CreateShelterForm />} />
        <Route path="shelter/:id" element={<ShelterDashboardPage />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="reservation/*" element={<ReservationPage />}>
          <Route path="add-profile" element={<AddProfilePage />} />
          <Route path="select-shelter" element={<SelectShelterPage />} />
          <Route path="select-room" element={<SelectRoomPage />} />
          <Route path="confirmation" element={<ConfirmationPage />} />
        </Route>
        <Route
          path="shelter/:shelterId/reservation/*"
          element={<ReservationPage />}
        >
          <Route path="add-profile" element={<AddProfilePage />} />
          <Route path="select-room" element={<SelectRoomPage />} />
          <Route path="confirmation" element={<ConfirmationPage />} />
        </Route>
      </Routes>
    </OperatorAuthProvider>
  );
}
