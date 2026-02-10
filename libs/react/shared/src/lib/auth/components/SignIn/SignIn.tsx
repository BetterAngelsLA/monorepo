import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../../components/Input';
import { useUser } from '../../../hooks';
import { useAllauthLogin } from '../../../hooks/useAllauthLogin';
import { useApiConfig } from '../../../providers';
import { Regex } from '../../../static';
import './SignIn.css';

export interface SignInProps {
  /** Path to redirect to after successful login */
  onSuccessRedirect: string;
  /** Welcome message description */
  description: string;
}

export default function SignIn({
  onSuccessRedirect,
  description,
}: SignInProps) {
  const { fetchClient, apiUrl } = useApiConfig();
  const { refetchUser } = useUser();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const {
    step,
    errorMsg,
    loading,
    handleSendCode,
    handleConfirmCode,
    handlePasswordLogin,
    resetStep,
  } = useAllauthLogin({
    fetchClient,
    onLoginSuccess: async () => {
      await refetchUser();
      navigate(onSuccessRedirect);
    },
  });

  const isPasswordLogin = email.endsWith('@example.com');
  const isValidEmail = Regex.email.test(email);

  return (
    <div className="bg-neutral-99 flex min-h-screen items-center justify-center">
      <div className="rounded-3xl p-10 flex flex-col bg-white shadow-md w-[460px]">
        <h1 className="font-bold text-2xl mb-2">Sign In</h1>
        <p className="mb-10">{description}</p>
        {step === 'initial' && (
          <>
            <Input
              className="mb-4"
              inputClassname="input-xl"
              label="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setOtp('');
                resetStep();
              }}
              autoCapitalize="none"
              placeholder="you@example.com"
            />

            {isPasswordLogin && (
              <Input
                className="mb-4"
                inputClassname="input-xl"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
              />
            )}

            {!!errorMsg && (
              <p className="text-alert-60 text-sm mb-4">{errorMsg}</p>
            )}

            <button
              className="btn btn-primary btn-xl"
              onClick={() =>
                isPasswordLogin
                  ? handlePasswordLogin(email, password)
                  : handleSendCode(email)
              }
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
              onChange={(e) => setOtp(e.target.value)}
              autoCapitalize="none"
              placeholder="Enter OTP"
            />

            <p>Check your email for the access code.</p>

            {!!errorMsg && (
              <p className="text-alert-60 text-sm mb-4">{errorMsg}</p>
            )}

            <button
              className="btn btn-primary btn-xl"
              onClick={() => handleConfirmCode(otp)}
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
