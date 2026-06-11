import {
  UpdateBedDocument,
  type UpdateBedMutation,
  type UpdateBedMutationVariables,
} from '../../api/__generated__/bedMutations.generated';
import { buildUpdateBedInput } from './createBedMutation';

export { buildUpdateBedInput, UpdateBedDocument as UPDATE_BED_MUTATION };
export type {
  UpdateBedMutation as UpdateBedMutationResult,
  UpdateBedMutationVariables,
};
