import { TFilterOption } from '@monorepo/expo/shared/ui-components';

export type TInteractionFilterType = 'teams' | 'authors' | 'organizations';

export type TInteractionFilters = Record<
  TInteractionFilterType,
  TFilterOption[]
>;
