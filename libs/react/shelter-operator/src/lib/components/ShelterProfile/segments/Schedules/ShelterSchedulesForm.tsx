import {
  type ScheduleInput,
  type ScheduleType,
  ScheduleTypeChoices,
} from '@monorepo/react/shelter';
import { Plus } from 'lucide-react';
import { ButtonDropdown } from '../../../base-ui/buttonDropdown';
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
  schedules: ScheduleType[];
  currentTab: ScheduleTypeChoices;
  onTabChange: (tab: ScheduleTypeChoices) => void;
  onSave: (scheduleType: ScheduleTypeChoices, inputs: ScheduleInput[]) => void;
};

export function ShelterSchedulesForm(props: TProps) {
  const { schedules, currentTab, onTabChange, onSave } = props;

  const existingTypes = SCHEDULE_TABS.filter((type) =>
    schedules.some((s) => s.scheduleType === type)
  );

  const missingTypes = SCHEDULE_TABS.filter((t) => !existingTypes.includes(t));
  const missingItems = missingTypes.map((t) => ({
    value: t,
    label: SCHEDULE_TAB_LABELS[t],
  }));

  const displayedTabs = existingTypes.includes(currentTab)
    ? existingTypes
    : [...existingTypes, currentTab];

  return (
    <div>
      <div className="flex items-center justify-end px-6 py-4">
        <ButtonDropdown
          items={missingItems}
          disabled={missingTypes.length === 0}
          onSelect={(item) => onTabChange(item.value as ScheduleTypeChoices)}
          leftIcon={<Plus size={20} />}
          menuAlign="right"
        >
          Add Schedule
        </ButtonDropdown>
      </div>

      <Tabs
        tabs={displayedTabs}
        selectedTab={currentTab}
        onTabPress={onTabChange}
        getLabel={(tab) => SCHEDULE_TAB_LABELS[tab]}
      />

      <div className="p-8">
        <ScheduleForm
          key={currentTab}
          scheduleType={currentTab}
          initialSchedules={schedules.filter(
            (s) => s.scheduleType === currentTab
          )}
          onSave={(inputs) => onSave(currentTab, inputs)}
        />
      </div>
    </div>
  );
}
