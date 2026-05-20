import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { WizardLayout } from '../../components/layout/WizardLayout';
import type { WizardStep } from '../../components/layout/WizardProgressBar';
import { paths, reservationSegments } from '../../routing';
import { ReservationFormData } from './types';

const ALL_STEPS: WizardStep[] = [
  { label: 'Add Profile', pathSegment: reservationSegments.addProfile },
  { label: 'Select Shelter', pathSegment: reservationSegments.selectShelter },
  { label: 'Select Room / Bed', pathSegment: reservationSegments.selectRoom },
  {
    label: 'Select Check-in By Date',
    pathSegment: reservationSegments.checkInByDate,
  },
  { label: 'Confirmation', pathSegment: reservationSegments.confirmation },
];

export function ReservationPage() {
  const { shelterId } = useParams();
  const isShelterLevel = !!shelterId;

  const methods = useForm<ReservationFormData>({
    defaultValues: {
      clients: [],
      shelterId: shelterId || '',
      roomId: null,
      bedId: null,
      startDate: null,
      reservationLayoutStyle: 'congregate',
    },
    mode: 'onTouched',
  });

  const { setValue } = methods;
  useEffect(() => {
    if (shelterId) {
      setValue('shelterId', shelterId);
    }
  }, [shelterId, setValue]);

  const steps = useMemo(() => {
    if (isShelterLevel) {
      return ALL_STEPS.filter((_, index) => index !== 1);
    }
    return ALL_STEPS;
  }, [isShelterLevel]);

  const stepPaths = useMemo(() => {
    const base = isShelterLevel
      ? paths.shelterReservation.replace(':shelterId', shelterId as string)
      : paths.reservation;

    return steps.map((step) => `${base}/${step.pathSegment}`);
  }, [isShelterLevel, shelterId, steps]);

  return (
    <WizardLayout<ReservationFormData>
      steps={steps}
      stepPaths={stepPaths}
      methods={methods}
      navigationConfig={{
        showNavigation: true,
      }}
    />
  );
}
