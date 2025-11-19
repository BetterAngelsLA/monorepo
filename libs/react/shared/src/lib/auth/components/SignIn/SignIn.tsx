import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../../components/Input';
import { Regex } from '../../../static';
import './SignIn.css';

export interface SignInProps {
  /** Path to redirect to after successful login */
  onSuccessRedirect?: string;
  /** Welcome message title */
  title?: string;
  /** Welcome message description */
  description?: string;
  /** API URL for links */
  apiUrl: string;
  /** Function to make authenticated API calls */
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
  /** Function to refetch user data after login */
  refetchUser: () => Promise<void>;
}

export default function SignIn({
  onSuccessRedirect = '/users',
  title = 'Sign In',
  description = 'Welcome! Sign in for Better Angels and start making a difference in the LA Community.',
  apiUrl,
  fetchClient,
  refetchUser,
}: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'otp'>('initial');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const isPasswordLogin = email.endsWith('@example.com');
  const isValidEmail = Regex.email.test(email);

  const handleError = (message: string) => {
    setErrorMsg(message);
    setLoading(false);
  };

  const handleSendCode = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetchClient('/_allauth/browser/v1/auth/code/request', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      if (res.ok || res.status === 401) {
        setStep('otp');
      } else {
        handleError('Unable to send code. Please try again.');
      }
    } catch (error) {
      console.error('Send code error:', error);
      handleError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, fetchClient]);

  const handleConfirmCode = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchClient('/_allauth/browser/v1/auth/code/confirm', {
        method: 'POST',
        body: JSON.stringify({ code: otp.trim() }),
      });
      const data = await res.json();

      if (res.ok && data?.meta?.is_authenticated) {
        await refetchUser();
        navigate(onSuccessRedirect);
      } else {
        handleError('Invalid code. Please try again.');
      }
    } catch (error) {
      console.error('Confirm code error:', error);
      handleError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [otp, fetchClient, refetchUser, navigate, onSuccessRedirect]);

  const handlePasswordLogin = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetchClient('/_allauth/browser/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: email.toLowerCase(), password }),
      });
      const data = await res.json();

      if (res.ok && data?.meta?.is_authenticated) {
        await refetchUser();
        navigate(onSuccessRedirect);
      } else {
        handleError('Invalid email or password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      handleError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, fetchClient, refetchUser, navigate, onSuccessRedirect]);

  return (
    <div className="bg-neutral-99 flex min-h-screen items-center justify-center">
      <div className="rounded-3xl p-10 flex flex-col bg-white shadow-md w-[460px]">
        <h1 className="font-bold text-2xl mb-2">{title}</h1>
        <p className="mb-10">{description}</p>
        {step === 'initial' && (
          <>
            <Input
              className="mb-4"
              inputClassname="input-xl"
              label="Email Address"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              autoCapitalize="none"
              placeholder="you@example.com"
            />

            {isPasswordLogin && (
              <input
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                type="password"
                placeholder="Password"
              />
            )}

            {!!errorMsg && <div>{errorMsg}</div>}

            <button
              className="btn btn-primary btn-xl"
              onClick={isPasswordLogin ? handlePasswordLogin : handleSendCode}
              disabled={
                loading || !isValidEmail || (isPasswordLogin && !password)
              }
            >
              Sign In
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <Input
              className="mb-4"
              inputClassname="input-xl"
              label="OTP Code"
              value={otp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOtp(e.target.value)
              }
              autoCapitalize="none"
              placeholder="Enter OTP"
            />

            <p>Check your email for the access code.</p>

            {!!errorMsg && <p>{errorMsg}</p>}

            <button
              className="btn btn-primary btn-xl"
              onClick={handleConfirmCode}
              disabled={loading || !otp.trim()}
            >
              Confirm OTP
            </button>
          </>
        )}
        <p className="mt-10">
          By continuing, you agree to our{' '}
          <a href={`${apiUrl}/legal/terms-of-service`} className="underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href={`${apiUrl}/legal/privacy-policy`} className="underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
