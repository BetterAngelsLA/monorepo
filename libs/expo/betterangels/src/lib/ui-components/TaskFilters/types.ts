import { TFilterOption } from '@monorepo/expo/shared/ui-components';

export type TTaskFilterType = 'team' | 'status' | 'client' | 'author';

export type TSelectedTaskFilters = Record<TTaskFilterType, TFilterOption[]>;
