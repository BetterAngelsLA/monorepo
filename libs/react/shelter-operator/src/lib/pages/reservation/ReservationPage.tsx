import { createBrowserRouter } from 'react-router-dom';
// import { ReservationWizard } from './ReservationWizard';
import { AddProfilePage } from './AddProfilePage';
import { ConfirmationPage } from './ConfirmationPage';
import { SelectRoomPage } from './SelectRoomPage';
import { SelectShelterPage } from './SelectShelterPage';

export const router = createBrowserRouter([
  // ── Standard: /reservation/* ─────────────────────────────────────────────
  {
    path: 'reservation',
    //element: <ReservationWizard />,
    children: [
      { path: 'add-profile', element: <AddProfilePage /> },
      { path: 'select-shelter', element: <SelectShelterPage /> },
      { path: 'select-room', element: <SelectRoomPage /> },
      { path: 'confirmation', element: <ConfirmationPage /> },
    ],
  },
]);
