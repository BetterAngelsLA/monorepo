import {
  type ScheduleInput,
  type ScheduleType,
  ScheduleTypeChoices,
} from '@monorepo/react/shelter';
import { ScheduleForm } from './ScheduleForm';

type TProps = {
  scheduleType: ScheduleTypeChoices;
  schedules: ScheduleType[];
  onSave: (inputs: ScheduleInput[]) => void;
  onDelete?: () => void;
};

export function ShelterSchedulesForm(props: TProps) {
  const { scheduleType, schedules, onSave, onDelete } = props;

  return (
    <div className="p-8 border-2 border-blue-500">
      <ScheduleForm
        key={scheduleType}
        scheduleType={scheduleType}
        initialSchedules={schedules.filter(
          (s) => s.scheduleType === scheduleType
        )}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
}
