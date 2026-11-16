import { Text } from '../base-ui/text/text';
import type { ScheduleChangeLine, ScheduleChangeTone } from './auditSchedule';

/**
 * Additions read green, removals red — the same pair the multi-value change rows
 * use, so a slot replacement matches how every other add/remove renders.
 */
const TONE_COLOR: Record<ScheduleChangeTone, string> = {
  added: 'text-success-30',
  removed: 'text-alert-60',
  changed: 'text-neutral-20',
};

/**
 * One schedule slot, collapsed to a single line:
 * `Added Thursday - Operating Hours: 06:00 - 16:00`.
 */
export function AuditScheduleEvent({
  line,
  className,
}: {
  line: ScheduleChangeLine;
  className?: string;
}) {
  return (
    <Text
      variant="caption"
      textColor={TONE_COLOR[line.tone]}
      className={className}
    >
      {line.text}
    </Text>
  );
}
