import type * as Types from '../../../../../apollo/graphql/__generated__/types';

export type HmisNotesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.HmisNoteFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  ordering?: Array<Types.HmisNoteOrdering> | Types.HmisNoteOrdering;
}>;
