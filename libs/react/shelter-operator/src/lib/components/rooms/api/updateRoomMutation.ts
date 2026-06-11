import {
  UpdateRoomDocument,
  type UpdateRoomMutation,
  type UpdateRoomMutationVariables,
} from './__generated__/roomMutations.generated';
import { buildUpdateRoomInput } from './createRoomMutation';

export { buildUpdateRoomInput, UpdateRoomDocument as UPDATE_ROOM_MUTATION };
export type {
  UpdateRoomMutation as UpdateRoomMutationResult,
  UpdateRoomMutationVariables,
};
