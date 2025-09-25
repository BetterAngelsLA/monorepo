import type { ServerError } from '@apollo/client';

export function isServerError(err: unknown): err is ServerError {
  return (
    typeof err === 'object' && err !== null && 'statusCode' in (err as any)
  );
}
