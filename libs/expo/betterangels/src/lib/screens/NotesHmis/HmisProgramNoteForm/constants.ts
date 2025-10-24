import { TFormKeys } from './types';

export const FORM_KEYS = {
  title: 'title',
  date: 'date',
  program: 'program',
  note: 'note',
} as const satisfies { [K in TFormKeys]: K };
