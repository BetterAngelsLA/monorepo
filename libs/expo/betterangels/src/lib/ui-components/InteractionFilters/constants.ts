import { TFilterOption } from '@monorepo/expo/shared/ui-components';
import { enumDisplaySelahTeam } from '../../static';
import { TInteractionFilters } from './types';

export const nullInteractionFilters: TInteractionFilters = {
  authors: [],
  teams: [],
  organizations: [],
};

export const teamOptions: TFilterOption[] = Object.entries(
  enumDisplaySelahTeam
).map(([key, value]) => ({
  id: key,
  label: value,
}));
