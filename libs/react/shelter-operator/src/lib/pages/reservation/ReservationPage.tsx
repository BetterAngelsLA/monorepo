import { operatorPath } from '@monorepo/react/shelter';
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
    const base = isShelterLevel
      ? `${operatorPath}/shelter/${shelterId}/reservation`
      : `${operatorPath}/reservation`;

    const segments = isShelterLevel
      ? ['add-profile', 'select-room', 'confirmation']
      : ['add-profile', 'select-shelter', 'select-room', 'confirmation'];

    return segments.map(seg => `${base}/${seg}`);
  }, [isShelterLevel, shelterId]);

  return (
    <WizardLayout
      steps={steps}
      stepPaths={paths}
      navigationConfig={{
        showNavigation: true,
      }}
    />
  );
}
