import { useCallback, useState } from 'react';
import type { FetchClient, LoginStep } from './useAllauthLogin';

export type SignupStep = 'form' | LoginStep;

interface UseAllauthSignupOptions {
  fetchClient: FetchClient;
  onSignupSuccess: () => void | Promise<void>;
}

interface UseAllauthSignupReturn {
  step: SignupStep;
  errorMsg: string;
  loading: boolean;
  resending: boolean;
  handleSignup: (data: {
    email: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  handleConfirmCode: (code: string) => Promise<void>;
  handleResendCode: () => Promise<void>;
  resetStep: () => void;
  clearError: () => void;
}

/**
 * Shared hook for allauth headless signup flow.
 *
 * Flow:
 * 1. User submits email + first_name + last_name → POST /_allauth/browser/v1/auth/signup
 * 2. Backend creates user, sends verification code via email
 * 3. User confirms code → POST /_allauth/browser/v1/auth/email/verify
 * 4. User is authenticated
 */
export function useAllauthSignup({
  fetchClient,
  onSignupSuccess,
}: UseAllauthSignupOptions): UseAllauthSignupReturn {
  const [step, setStep] = useState<SignupStep>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const clearError = useCallback(() => setErrorMsg(''), []);
  const resetStep = useCallback(() => {
    setStep('form');
    setErrorMsg('');
  }, []);

  const handleSignup = useCallback(
    async (data: { email: string; firstName: string; lastName: string }) => {
      setLoading(true);
      setErrorMsg('');

      try {
        const res = await fetchClient('/_allauth/browser/v1/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: data.email.toLowerCase().trim(),
            first_name: data.firstName.trim(),
            last_name: data.lastName.trim(),
          }),
        });

        if (res.ok) {
          // 200 means already authenticated (e.g. verification not required)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let body: any;
          try {
            body = await res.json();
          } catch {
            // fall through
          }
          if (body?.meta?.is_authenticated) {
            await onSignupSuccess();
          } else {
            setStep('otp');
          }
        } else if (res.status === 401) {
          // 401 means "pending verification" — code was sent
          setStep('otp');
        } else if (res.status === 409) {
          // 409 means already logged in — treat as success
          await onSignupSuccess();
        } else {
          let msg = 'Unable to create account. Please try again.';
          try {
            const body = await res.json();
            const formErrors = body?.form?.errors;
            const fieldErrors = body?.form?.fields;
            if (formErrors?.length) {
              msg = formErrors
                .map((e: { message: string }) => e.message)
                .join(' ');
            } else if (fieldErrors?.email?.length) {
              msg = fieldErrors.email
                .map((e: { message: string }) => e.message)
                .join(' ');
            }
          } catch {
            // ignore parse error
          }
          setErrorMsg(msg);
        }
      } catch (error) {
        console.error('Signup error:', error);
        setErrorMsg('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [fetchClient, onSignupSuccess]
  );

  const handleConfirmCode = useCallback(
    async (code: string) => {
      setLoading(true);
      setErrorMsg('');

      try {
        const res = await fetchClient(
          '/_allauth/browser/v1/auth/email/verify',
          {
            method: 'POST',
            body: JSON.stringify({ key: code.trim() }),
          }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        try {
          data = await res.json();
        } catch {
          setErrorMsg('Unexpected server response. Please try again.');
          return;
        }

        if ((res.ok && data?.meta?.is_authenticated) || res.status === 409) {
          await onSignupSuccess();
        } else if (res.status === 401 && !data?.meta?.is_authenticated) {
          // Email verified but not yet authenticated (e.g. LOGIN_ON_EMAIL_CONFIRMATION=False)
          // Still consider this a success — the verification worked
          await onSignupSuccess();
        } else {
          setErrorMsg('Invalid code. Please try again.');
        }
      } catch (error) {
        console.error('Confirm code error:', error);
        setErrorMsg('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [fetchClient, onSignupSuccess]
  );

  const handleResendCode = useCallback(async () => {
    setResending(true);
    setErrorMsg('');

    try {
      const res = await fetchClient(
        '/_allauth/browser/v1/auth/email/verify/resend',
        { method: 'POST' }
      );

      if (!res.ok && res.status !== 200) {
        if (res.status === 429) {
          setErrorMsg('Too many requests. Please wait before trying again.');
        } else {
          setErrorMsg('Unable to resend code. Please try again.');
        }
      }
    } catch (error) {
      console.error('Resend code error:', error);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  }, [fetchClient]);

  return {
    step,
    errorMsg,
    loading,
    resending,
    handleSignup,
    handleConfirmCode,
    handleResendCode,
    resetStep,
    clearError,
  };
}
