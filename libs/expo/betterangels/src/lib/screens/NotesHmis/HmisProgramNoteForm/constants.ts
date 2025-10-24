import { TFormKeys } from './types';

export const FORM_KEYS = {
  title: 'title',
  date: 'date',
  enrollmentId: 'enrollmentId',
  note: 'note',
} as const satisfies { [K in TFormKeys]: K };
