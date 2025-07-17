import { Regex } from '@monorepo/react/shared';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks';
import { useApiConfig } from '../../providers';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'otp'>('initial');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { fetchClient } = useApiConfig();
  const { refetchUser } = useUser();
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
        navigate('/');
      } else {
        handleError('Invalid code. Please try again.');
      }
    } catch (error) {
      console.error('Confirm code error:', error);
      handleError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [otp, fetchClient, refetchUser]);

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
        navigate('/');
      } else {
        handleError('Invalid email or password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      handleError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, fetchClient, refetchUser]);

  return (
    <div>
      {step === 'initial' && (
        <>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
            placeholder="you@example.com"
          />

          {isPasswordLogin && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
            />
          )}

          {!!errorMsg && <div>{errorMsg}</div>}

          <button
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
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            autoCapitalize="characters"
            placeholder="Enter OTP"
          />

          <p>Check your email for the access code.</p>

          {!!errorMsg && <p>{errorMsg}</p>}

          <button onClick={handleConfirmCode} disabled={loading || !otp.trim()}>
            Confirm OTP
          </button>
        </>
      )}
    </div>
  );
}
