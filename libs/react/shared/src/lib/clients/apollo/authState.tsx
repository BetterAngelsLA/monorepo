import { makeVar } from '@apollo/client';

/**
 * Signal that current auth is invalid (e.g., 401/UNAUTH). Used to trigger a re-check.
 * DO NOT fire this on successful login. For login, call refetchUser() directly.
 */
export const authInvalidationTickVar = makeVar<number>(0);
