import { useCallback, useMemo, useState } from 'react';

export type FetchClient = (
  path: string,
  options?: RequestInit
) => Promise<Response>;

export type LoginStep = 'initial' | 'otp';

interface UseAllauthLoginOptions {
  fetchClient: FetchClient;
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
  fetchClient,
  onLoginSuccess,
  onCodeSent,
}: UseAllauthLoginOptions): UseAllauthLoginReturn {
  const [step, setStep] = useState<LoginStep>('initial');
  const [errorMsg, setErrorMsg] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const loading = useMemo(
    () => sendingCode || confirmingCode || loggingIn,
    [sendingCode, confirmingCode, loggingIn]
  );

  const clearError = useCallback(() => setErrorMsg(''), []);

  const resetStep = useCallback(() => {
    setStep('initial');
    setErrorMsg('');
  }, []);

  const handleSendCode = useCallback(
    async (email: string) => {
      const cleaned = stripDemoTag(email.toLowerCase().trim());
      setSendingCode(true);
      setErrorMsg('');

      try {
        const res = await fetchClient(
          '/_allauth/browser/v1/auth/code/request',
          {
            method: 'POST',
            body: JSON.stringify({ email: cleaned }),
          }
        );

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
    [fetchClient, onCodeSent]
  );

  const handleConfirmCode = useCallback(
    async (code: string) => {
      setConfirmingCode(true);
      setErrorMsg('');

      try {
        const res = await fetchClient(
          '/_allauth/browser/v1/auth/code/confirm',
          {
            method: 'POST',
            body: JSON.stringify({ code: code.trim() }),
          }
        );

        const data = await res.json();

        if (res.ok && data?.meta?.is_authenticated) {
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
    [fetchClient, onLoginSuccess]
  );

  const handlePasswordLogin = useCallback(
    async (email: string, password: string) => {
      setLoggingIn(true);
      setErrorMsg('');

      try {
        const cleaned = stripDemoTag(email.toLowerCase().trim());
        const res = await fetchClient('/_allauth/browser/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            username: cleaned,
            password,
          }),
        });

        const data = await res.json();

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
    [fetchClient, onLoginSuccess]
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
