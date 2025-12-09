import { TFormKeys } from './types';

export const FORM_KEYS = {
  title: 'title',
  date: 'date',
  refClientProgram: 'refClientProgram',
  note: 'note',
  services: 'services',
} as const satisfies { [K in TFormKeys]: K };
