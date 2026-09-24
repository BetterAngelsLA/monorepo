import { ErrorHmis } from '@monorepo/expo/shared/clients';
import type { HmisProdRequestDebugInfo } from './types';

/**
 * Error thrown by `ClientHmisProd` — same shape as the shared `ErrorHmis`,
 * plus the raw debug payload (full URL + response body) so the debug UI can
 * offer it for copy/paste.
 */
export class ErrorHmisProd extends ErrorHmis {
  readonly debugInfo: HmisProdRequestDebugInfo;

  constructor(
    message: string,
    status: number,
    debugInfo: HmisProdRequestDebugInfo,
    data?: unknown,
  ) {
    super(message, status, data);
    this.name = 'ErrorHmisProd';
    this.debugInfo = debugInfo;
  }
}

/**
 * Whether the error means the HMIS session is missing or invalid — i.e. the
 * remedy is logging in to HMIS again. Covers server 401s, our no-token
 * fast-fail, and Clarity's CSRF-guard rejections (403).
 */
export const isAuthErrorHmisProd = (error: unknown): boolean =>
  error instanceof ErrorHmisProd &&
  (error.status === 401 ||
    error.status === 403 ||
    error.debugInfo.hasAuthToken === false);
