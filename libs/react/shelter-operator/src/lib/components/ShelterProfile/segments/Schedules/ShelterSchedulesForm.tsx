import {
  type ScheduleInput,
  type ScheduleType,
  ScheduleTypeChoices,
} from '@monorepo/react/shelter';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../base-ui/buttons';
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

  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAddDropdownOpen(false);
      }
    }

    if (isAddDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddDropdownOpen]);

  const existingTypes = SCHEDULE_TABS.filter((type) =>
    schedules.some((s) => s.scheduleType === type)
  );

  const missingTypes = SCHEDULE_TABS.filter((t) => !existingTypes.includes(t));

  const displayedTabs = existingTypes.includes(currentTab)
    ? existingTypes
    : [...existingTypes, currentTab];

  function handleAddSchedule(type: ScheduleTypeChoices) {
    setIsAddDropdownOpen(false);
    onTabChange(type);
  }

  return (
    <div>
      <div className="flex items-center justify-end px-6 py-4">
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="primary"
            disabled={missingTypes.length === 0}
            onClick={() => setIsAddDropdownOpen((v) => !v)}
          >
            Add Schedule
          </Button>

          {isAddDropdownOpen && missingTypes.length > 0 && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg min-w-48">
              {missingTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAddSchedule(type)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  {SCHEDULE_TAB_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
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
