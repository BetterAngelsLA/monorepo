import {
  ScheduleTypeChoices,
  type ScheduleInput,
} from '@monorepo/react/shelter';
import { useState } from 'react';
import { useShelter } from '../../../../hooks/useShelter';
import { Tabs } from '../../../base-ui/tabs';
import { ScheduleForm } from '../../../Schedule/ScheduleForm';

const SCHEDULE_TABS: ScheduleTypeChoices[] = [
  ScheduleTypeChoices.Operating,
  ScheduleTypeChoices.Intake,
  ScheduleTypeChoices.MealService,
  ScheduleTypeChoices.StaffAvailability,
];

const SCHEDULE_TAB_LABELS: Record<ScheduleTypeChoices, string> = {
  [ScheduleTypeChoices.Operating]: 'Operating Hours',
  [ScheduleTypeChoices.Intake]: 'Intake Hours',
  [ScheduleTypeChoices.MealService]: 'Meal Service',
  [ScheduleTypeChoices.StaffAvailability]: 'Staff Availability',
};

type TProps = {
  shelterId: string;
};

export function ShelterSchedules(props: TProps) {
  const { shelterId } = props;

  const [currentTab, setCurrentTab] = useState(ScheduleTypeChoices.Operating);

  const { shelter } = useShelter(shelterId);

  if (!shelter) {
    return null;
  }

  const handleSave = (inputs: ScheduleInput[]) => {
    // TODO: wire up updateShelter mutation with the built inputs
    console.log('schedule inputs to save', inputs);
  };

  return (
    <div>
      <Tabs
        tabs={SCHEDULE_TABS}
        selectedTab={currentTab}
        onTabPress={setCurrentTab}
        getLabel={(tab) => SCHEDULE_TAB_LABELS[tab]}
      />

      <div className="p-8">
        <ScheduleForm
          key={currentTab}
          scheduleType={currentTab}
          initialSchedules={shelter.schedules.filter(
            (s) => s.scheduleType === currentTab
          )}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
