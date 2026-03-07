import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { WizardLayout } from '../../components/layouts/WizardLayout';
import type { WizardStep } from '../../components/layouts/WizardProgressBar';

const ALL_STEPS: WizardStep[] = [
  { id: 'add-profile', label: 'Add Profile' },
  { id: 'select-shelter', label: 'Select Shelter' },
  { id: 'select-room', label: 'Select Room / Bed' },
  { id: 'confirmation', label: 'Confirmation' },
];

const ALL_PATHS = [
  'add-profile',
  'select-shelter',
  'select-room',
  'confirmation',
];

export function ReservationPage() {
  const { shelterId } = useParams();
  const isShelterLevel = !!shelterId;

  const steps = useMemo(() => {
    if (isShelterLevel) {
      return ALL_STEPS.filter((step) => step.id !== 'select-shelter');
    }
    return ALL_STEPS;
  }, [isShelterLevel]);

  const paths = useMemo(() => {
    if (isShelterLevel) {
      return ALL_PATHS.filter((path) => path !== 'select-shelter');
    }
    return ALL_PATHS;
  }, [isShelterLevel]);

  return (
    <WizardLayout
      steps={steps}
      stepPaths={paths}
      pageTitle="Shelter Reservation"
    />
  );
}
