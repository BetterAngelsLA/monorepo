import { FetchResult } from '@apollo/client';
import { OperationInfo } from '../__generated__/types';

// export type UpdateHmisProfileMutationResult = Apollo.MutationResult<UpdateHmisProfileMutation>;
// export type GraphQLResponse<T extends Record<string, any>> = {
//   data?: T | null;
//   errors?: any[];
// };
// export type GraphQLResponse<T extends Record<string, any>> = MutationResult<T>;
export type GraphQLResponse<T> = FetchResult<T>; // Use FetchResult instead of MutationResult

// export type GraphQLResponse<T> = {
//   data: T;
// };

export type GraphQLQueryResponse = {
  [key: string]: OperationInfo;
};

// export type OperationMessage = {
//   kind: 'VALIDATION' | 'ERROR' | 'INFO';
//   field: string | null;
//   message: string;
//   __typename: 'OperationMessage';
// };

// export type OperationInfo = {
//   messages: OperationMessage[];
//   __typename: 'OperationInfo';
// };
