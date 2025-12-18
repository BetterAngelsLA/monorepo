import { TFilterOption } from '@monorepo/expo/shared/ui-components';
import { HmisNoteFilter } from '../../apollo';

const toIds = (arr?: TFilterOption[]) => arr?.map((option) => option.id);

export function toInteractionFilterValueHmis(input: {
  search: string;
  authors?: TFilterOption[];
}): HmisNoteFilter {
  return {
    search: input.search || undefined,
    authors: toIds(input.authors),
  };
}
