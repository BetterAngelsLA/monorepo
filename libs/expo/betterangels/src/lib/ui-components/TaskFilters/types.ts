import { TFilterOption } from '@monorepo/expo/shared/ui-components';

export type TTaskFilterType =
  | 'teams'
  | 'status'
  | 'clientProfile'
  | 'authors'
  | 'organizations';

export type TTaskFilters = Record<TTaskFilterType, TFilterOption[]>;
