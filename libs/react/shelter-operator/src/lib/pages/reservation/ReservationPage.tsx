import {
  operatorPath,
  reservationAddProfileSegment,
  reservationCheckInByDateSegment,
  reservationConfirmationSegment,
  reservationPathSegment,
  reservationSelectRoomSegment,
  reservationSelectShelterSegment,
} from '@monorepo/react/shelter';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { WizardLayout } from '../../components/layout/WizardLayout';
import type { WizardStep } from '../../components/layout/WizardProgressBar';

const ALL_STEPS: WizardStep[] = [
  { label: 'Add Profile', pathSegment: reservationAddProfileSegment },
  { label: 'Select Shelter', pathSegment: reservationSelectShelterSegment },
  { label: 'Select Room / Bed', pathSegment: reservationSelectRoomSegment },
  { label: 'Select Check-in By Date', pathSegment: reservationCheckInByDateSegment,
  },
  { label: 'Confirmation', pathSegment: reservationConfirmationSegment },
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
      ? `${operatorPath}/shelter/${shelterId}/${reservationPathSegment}`
      : `${operatorPath}/${reservationPathSegment}`;

    return steps.map((step) => `${base}/${step.pathSegment}`);
  }, [isShelterLevel, shelterId, steps]);

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
