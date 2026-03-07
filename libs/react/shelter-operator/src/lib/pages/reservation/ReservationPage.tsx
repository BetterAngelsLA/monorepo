import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { WizardLayout } from '../../components/layouts/WizardLayout';
import type { WizardStep } from '../../components/layouts/WizardProgressBar';

const ALL_STEPS: WizardStep[] = [
  { label: 'Add Profile' },
  { label: 'Select Shelter' },
  { label: 'Select Room / Bed' },
  { label: 'Confirmation' },
];

const ALL_PATHS = [
  'add-profile',
  'select-shelter',
  'select-room',
  'confirmation',
];

export function ReservationPage() {
  const { state } = useLocation();
  const isShelterLevel = !!state?.shelterId;

  const steps = useMemo(() => {
    if (isShelterLevel) {
      return ALL_STEPS.filter((step) => step.label !== 'Select Shelter');
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
