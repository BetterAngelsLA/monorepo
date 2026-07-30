/**
 * A known BetterAngels error
 */
export class BaError extends Error {
  constructor(message = 'Sorry, something went wrong.') {
    super(message);
    this.name = 'BaError';
  }
}
