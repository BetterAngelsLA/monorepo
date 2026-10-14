import { formatDistanceToNow } from 'date-fns';

export type FormattedDatePreset = 'date' | 'date-time' | 'relative';

export function formatValue(date: Date, preset: FormattedDatePreset): string {
  if (preset === 'relative') {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  if (preset === 'date') {
    return date.toLocaleDateString('en-US', { dateStyle: 'medium' });
  }

  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
