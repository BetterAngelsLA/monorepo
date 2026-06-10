import {
  ScheduleTypeChoices,
  type ScheduleInput,
} from '@monorepo/react/shelter';
import { useState } from 'react';
import {
  useAdminShelterProfile,
  useUpdateShelterProfile,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import { ShelterSchedulesForm } from './ShelterSchedulesForm';

type TProps = {
  shelterId: string;
};

export function ShelterSchedules(props: TProps) {
  const { shelterId } = props;

  const [currentTab, setCurrentTab] = useState(ScheduleTypeChoices.Operating);

  const { shelter } = useAdminShelterProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  async function onSave(
    scheduleType: ScheduleTypeChoices,
    inputs: ScheduleInput[]
  ) {
    if (!shelter) return;

    const otherSchedules: ScheduleInput[] = shelter.schedules
      .filter((s) => s.scheduleType !== scheduleType)
      .map((s) => ({
        scheduleType: s.scheduleType,
        days: s.day ? [s.day] : undefined,
        startTime: s.startTime ?? undefined,
        endTime: s.endTime ?? undefined,
        startDate: s.startDate ?? undefined,
        endDate: s.endDate ?? undefined,
        condition: s.condition ?? undefined,
        isException: s.isException,
      }));

    try {
      const response = await updateShelter({
        variables: {
          data: {
            id: shelterId,
            schedules: [...otherSchedules, ...inputs],
          },
        },
      });

      const result = response.data?.updateShelter;

      if (result?.__typename === 'ShelterType') {
        showToast({
          status: 'success',
          title: 'Schedule updated.',
        });

        return;
      }

      throw new Error('unexpected query error');
    } catch (e) {
      console.error(`[updateShelter error]: ${e}.`);

      showToast({
        status: 'error',
        title: 'Update failed',
        description: 'An unexpected error occurred.',
      });
    }
  }

  if (!shelter) {
    return null;
  }

  return (
    <ShelterSchedulesForm
      schedules={shelter.schedules}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onSave={onSave}
    />
  );
}
