import { BaError } from './BaError';

/**
 * A known BetterAngels permission error.
 * Thrown when the user is not authorized to perform an action.
 * Consumers can catch this to redirect to login or show a permission-denied UI.
 */
export class BaPermissionError extends BaError {
  constructor(message = 'You are not authorized to perform this operation') {
    super(message);
    this.name = 'BaPermissionError';
  }
}
