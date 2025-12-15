import { TFilterOption } from '@monorepo/expo/shared/ui-components';
import { SelahTeamEnum, TaskFilter, TaskStatusEnum } from '../../../apollo';

const toIds = (arr?: TFilterOption[]) => arr?.map((option) => option.id);

const toEnums = <T extends string>(arr?: TFilterOption[]) =>
  arr?.map((option) => option.id as T);

export function toTaskFilterValue(input: {
  search: string;
  authors?: TFilterOption[];
  organizations?: TFilterOption[];
  teams?: TFilterOption[];
  status?: TFilterOption[];
  clientProfiles?: TFilterOption[];
  hmisClientProfiles?: TFilterOption[];
}): TaskFilter {
  return {
    search: input.search || undefined,
    authors: toIds(input.authors),
    organizations: toIds(input.organizations),
    clientProfiles: toIds(input.clientProfiles),
    hmisClientProfiles: toIds(input.hmisClientProfiles),
    teams: toEnums<SelahTeamEnum>(input.teams),
    status: toEnums<TaskStatusEnum>(input.status),
  };
}
