import {
  BE_PROTOCOL_ERROR_CODE,
  BE_VALIDATION_ERROR_CODE,
} from './backendApiCodes';

export type BaApiErrorCode =
  | (typeof BE_PROTOCOL_ERROR_CODE)[keyof typeof BE_PROTOCOL_ERROR_CODE]
  | (typeof BE_VALIDATION_ERROR_CODE)[keyof typeof BE_VALIDATION_ERROR_CODE];
