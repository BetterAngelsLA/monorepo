/**
 * A known BetterAngels error
 */
export class BaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BaError';
  }
}
