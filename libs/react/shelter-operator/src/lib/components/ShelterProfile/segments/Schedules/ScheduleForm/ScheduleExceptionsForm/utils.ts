import type { ExceptionEntry } from '../types';

let _nextId = 0;

export function buildDefaultExceptionEntry(): ExceptionEntry {
  return {
    localId: String(++_nextId),
    startDate: '',
    endDate: '',
    closedAllDay: false,
    startTime: '',
    endTime: '',
    condition: undefined,
  };
}
