import { TFilterOption } from '@monorepo/expo/shared/ui-components';

export type TModelFilterType =
  | 'teams'
  | 'authors'
  | 'organizations'
  | 'clientProfiles'
  | 'hmisClientProfiles'
  | 'taskStatus';

export type TModelFilterConfig = {
  type: TModelFilterType;
  buttonLabel?: string;
  headerTitle?: string;
  searchPlaceholder?: string;
};

export type TModelFilterFullConfig = Required<TModelFilterConfig>;

export type TModelFilters = Partial<Record<TModelFilterType, TFilterOption[]>>;
