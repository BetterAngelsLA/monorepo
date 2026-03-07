import { Route } from 'react-router-dom';
import { AddProfilePage } from './AddProfilePage';
import { ConfirmationPage } from './ConfirmationPage';
import { ReservationPage } from './ReservationPage';
import { SelectRoomPage } from './SelectRoomPage';
import { SelectShelterPage } from './SelectShelterPage';

export function ReservationRoutes() {
  return (
    <Route path="reservation/*" element={<ReservationPage />}>
      <Route path="add-profile" element={<AddProfilePage />} />
      <Route path="select-shelter" element={<SelectShelterPage />} />
      <Route path="select-room" element={<SelectRoomPage />} />
      <Route path="confirmation" element={<ConfirmationPage />} />
    </Route>
  );
}
