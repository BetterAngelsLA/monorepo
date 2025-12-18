import { TFilterOption } from '@monorepo/expo/shared/ui-components';
import { SelahTeamEnum, TaskFilter } from '../../../apollo';

const toIds = (arr?: TFilterOption[]) => arr?.map((option) => option.id);

const toEnums = <T extends string>(arr?: TFilterOption[]) =>
  arr?.map((option) => option.id as T);

export function toInteractionFilterValue(input: {
  search: string;
  authors?: TFilterOption[];
  organizations?: TFilterOption[];
  teams?: TFilterOption[];
}): TaskFilter {
  return {
    search: input.search || undefined,
    authors: toIds(input.authors),
    organizations: toIds(input.organizations),
    teams: toEnums<SelahTeamEnum>(input.teams),
  };
}
