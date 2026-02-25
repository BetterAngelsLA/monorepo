import { ErrorLike } from '@apollo/client';

export function toErrorLike(error: unknown): ErrorLike {
  if (error && typeof error === 'object' && 'message' in error) {
    return error as ErrorLike;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown error occurred');
}
