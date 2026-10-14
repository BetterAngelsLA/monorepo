import type { ExceptionEntry } from '../types';

export function buildDefaultExceptionEntry(): ExceptionEntry {
  return {
    localId: crypto.randomUUID(),
    startDate: '',
    endDate: '',
    closedAllDay: false,
    startTime: '',
    endTime: '',
    condition: undefined,
  };
}
