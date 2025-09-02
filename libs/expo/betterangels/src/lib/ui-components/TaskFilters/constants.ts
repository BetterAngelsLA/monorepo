import { TFilterOption } from '@monorepo/expo/shared/ui-components';
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../static';

export const statusOptions: TFilterOption[] = Object.entries(
  enumDisplayTaskStatus
).map(([key, value]) => ({
  id: key,
  label: value,
}));

export const teamOptions: TFilterOption[] = Object.entries(
  enumDisplaySelahTeam
).map(([key, value]) => ({
  id: key,
  label: value,
}));
