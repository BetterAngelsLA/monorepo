import { useCallback, useState } from 'react';

export type FetchFn = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type LoginStep = 'initial' | 'otp';

interface UseAllauthLoginOptions {
  /** URL-baked fetch — paths only, base URL is pre-appended. */
  fetch: FetchFn;
  onLoginSuccess: () => void | Promise<void>;
  onCodeSent?: () => void;
}

interface UseAllauthLoginReturn {
  step: LoginStep;
  errorMsg: string;
  /** True when any auth operation is in flight. */
  loading: boolean;
  sendingCode: boolean;
  confirmingCode: boolean;
  loggingIn: boolean;
  handleSendCode: (email: string) => Promise<void>;
  handleConfirmCode: (code: string) => Promise<void>;
  handlePasswordLogin: (email: string, password: string) => Promise<void>;
  resetStep: () => void;
  clearError: () => void;
}

/**
 * Shared hook for allauth REST-based authentication.
 *
 * Supports two login flows:
 * 1. OTP (login-by-code): send code via `/_allauth/browser/v1/auth/code/request`,
 *    then confirm via `/_allauth/browser/v1/auth/code/confirm`.
 * 2. Password: login via `/_allauth/browser/v1/auth/login`.
 *
 * All flows use allauth's headless browser API directly — no custom GraphQL mutations needed.
 */

/**
 * Strip the "+demo" email tag used by the frontend to select the demo
 * environment.  The tag is only a client-side routing signal and must never
 * reach the backend, which would fail to find the user.
 */
function stripDemoTag(email: string): string {
  return email.replace('+demo@', '@');
}

export function useAllauthLogin({
  fetch,
  onLoginSuccess,
  onCodeSent,
}: UseAllauthLoginOptions): UseAllauthLoginReturn {
  const [step, setStep] = useState<LoginStep>('initial');
  const [errorMsg, setErrorMsg] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const loading = sendingCode || confirmingCode || loggingIn;

  const clearError = useCallback(() => setErrorMsg(''), []);

  const resetStep = useCallback(() => {
    setStep('initial');
    setErrorMsg('');
  }, []);

  const post = useCallback(
    (path: string, body: unknown) =>
      fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    [fetch],
  );

  const handleSendCode = useCallback(
    async (email: string) => {
      const cleaned = stripDemoTag(email.toLowerCase().trim());
      setSendingCode(true);
      setErrorMsg('');

      try {
        const res = await post('/_allauth/browser/v1/auth/code/request', {
          email: cleaned,
        });

        if (res.ok || res.status === 401) {
          setStep('otp');
          onCodeSent?.();
        } else {
          setErrorMsg('Unable to send code. Please try again.');
        }
      } catch (error) {
        console.error('Send code error:', error);
        setErrorMsg('Network error. Please try again.');
      } finally {
        setSendingCode(false);
      }
    },
    [post, onCodeSent],
  );

  const handleConfirmCode = useCallback(
    async (code: string) => {
      setConfirmingCode(true);
      setErrorMsg('');

      try {
        const res = await post('/_allauth/browser/v1/auth/code/confirm', {
          code: code.trim(),
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error(
            'Confirm code: failed to parse response as JSON',
            parseError,
          );
          setErrorMsg('Unexpected server response. Please try again.');
          return;
        }

        // Success (200) or already authenticated (409)
        if ((res.ok && data?.meta?.is_authenticated) || res.status === 409) {
          await onLoginSuccess();
        } else {
          setErrorMsg('Invalid code. Please try again.');
        }
      } catch (error) {
        console.error('Confirm code error:', error);
        setErrorMsg('Network error. Please try again.');
      } finally {
        setConfirmingCode(false);
      }
    },
    [post, onLoginSuccess],
  );

  const handlePasswordLogin = useCallback(
    async (email: string, password: string) => {
      setLoggingIn(true);
      setErrorMsg('');

      try {
        const cleaned = stripDemoTag(email.toLowerCase().trim());
        const res = await post('/_allauth/browser/v1/auth/login', {
          email: cleaned,
          password,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error('Login: failed to parse response as JSON', parseError);
          setErrorMsg('Unexpected server response. Please try again.');
          return;
        }

        if (res.ok && data?.meta?.is_authenticated) {
          await onLoginSuccess();
        } else {
          setErrorMsg('Invalid email or password.');
        }
      } catch (error) {
        console.error('Login error:', error);
        setErrorMsg('Network error. Please try again.');
      } finally {
        setLoggingIn(false);
      }
    },
    [post, onLoginSuccess],
  );

  return {
    step,
    errorMsg,
    loading,
    sendingCode,
    confirmingCode,
    loggingIn,
    handleSendCode,
    handleConfirmCode,
    handlePasswordLogin,
    resetStep,
    clearError,
  };
}
