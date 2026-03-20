import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { WizardLayout } from '../../components/layout/WizardLayout';
import type { WizardStep } from '../../components/layout/WizardProgressBar';

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
  const { shelterId } = useParams();
  const isShelterLevel = !!shelterId;

  const steps = useMemo(() => {
    if (isShelterLevel) {
      return ALL_STEPS.filter((_, index) => index !== 1);
    }
    return ALL_STEPS;
  }, [isShelterLevel]);

  const paths = useMemo(() => {
    if (isShelterLevel) {
      return ALL_PATHS.filter((path) => path !== 'select-shelter');
    }
    return ALL_PATHS;
  }, [isShelterLevel]);

  return <WizardLayout steps={steps} stepPaths={paths} />;
}
