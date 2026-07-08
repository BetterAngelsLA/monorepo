import {
  BE_PROTOCOL_ERROR_CODE,
  BE_VALIDATION_ERROR_CODE,
} from './backendApiCodes';
import { BaApiErrorCode } from './types';

export const DEFAULT_GQL_ERROR_MESSAGE = 'An unknown error occurred.';

export const DEFAULT_API_ERROR_MESSAGE: Record<BaApiErrorCode, string> = {
  // Protocol-level
  [BE_PROTOCOL_ERROR_CODE.UNAUTHENTICATED]:
    'You must be logged in to perform this action.',
  [BE_PROTOCOL_ERROR_CODE.NOT_FOUND]: 'The requested item was not found.',
  // Domain-level
  [BE_VALIDATION_ERROR_CODE.CA_ID_INVALID]:
    'California ID must be 1 letter followed by 7 numbers',
  [BE_VALIDATION_ERROR_CODE.CA_ID_IN_USE]:
    'California ID in use by another client',
  [BE_VALIDATION_ERROR_CODE.EMAIL_INVALID]: 'Enter a valid email address',
  [BE_VALIDATION_ERROR_CODE.EMAIL_IN_USE]:
    'User with this Email already exists',
  [BE_VALIDATION_ERROR_CODE.HMIS_ID_IN_USE]: 'HMIS ID in use by another client',
  [BE_VALIDATION_ERROR_CODE.HMIS_ID_NOT_PROVIDED]:
    'Enter HMIS ID or remove this entry',
  [BE_VALIDATION_ERROR_CODE.NAME_NOT_PROVIDED]:
    'Filling out one of the fields is required',
  [BE_VALIDATION_ERROR_CODE.PHONE_NUMBER_INVALID]:
    'Please enter a valid 10-digit phone number',
};
