import { mergeCss } from '@monorepo/react/shared';
import {
  type ScheduleInput,
  type ScheduleType,
  ScheduleTypeChoices,
} from '@monorepo/react/shelter';
import { ScheduleForm } from './ScheduleForm';

type TProps = {
  scheduleType: ScheduleTypeChoices;
  schedules: ScheduleType[];
  onSave: (schedules: ScheduleInput[]) => void;
  onDelete?: () => void;
  className?: string;
};

export function ShelterSchedulesForm(props: TProps) {
  const { scheduleType, schedules, onSave, onDelete, className } = props;

  return (
    <div className={mergeCss(['p-8', className])}>
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
