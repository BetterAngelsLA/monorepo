import { Input, Regex, useAllauthSignup } from '@monorepo/react/shared';
import { useApiConfig, useUser } from '@monorepo/react/shelter';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function SignUp() {
  const { fetchClient, apiUrl } = useApiConfig();
  const { refetchUser } = useUser();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const {
    step,
    errorMsg,
    loading,
    handleSignup,
    handleConfirmCode,
    resetStep,
  } = useAllauthSignup({
    fetchClient,
    onSignupSuccess: async () => {
      await refetchUser();
      navigate('/operator');
    },
  });

  const isValidEmail = Regex.email.test(email);
  const isFormValid =
    firstName.trim().length > 0 && lastName.trim().length > 0 && isValidEmail;

  return (
    <div className="bg-neutral-99 flex min-h-screen items-center justify-center">
      <div className="rounded-3xl p-10 flex flex-col bg-white shadow-md w-[460px]">
        <h1 className="font-bold text-2xl mb-2">Create Account</h1>
        <p className="mb-10">Sign up to get started managing your shelter.</p>

        {step === 'form' && (
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSignup({ email, firstName, lastName });
            }}
          >
            <Input
              className="mb-4"
              inputClassname="input-xl"
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
            />

            <Input
              className="mb-4"
              inputClassname="input-xl"
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />

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

            {!!errorMsg && (
              <p className="text-alert-60 text-sm mb-4">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-xl"
              disabled={loading || !isFormValid}
            >
              Create Account
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmCode(otp);
            }}
          >
            <Input
              className="mb-4"
              inputClassname="input-xl"
              label="Verification Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoCapitalize="none"
              placeholder="Enter code"
            />

            <p className="mb-4 text-sm text-gray-600">
              Check your email for the verification code.
            </p>

            {!!errorMsg && (
              <p className="text-alert-60 text-sm mb-4">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-xl"
              disabled={loading || !otp.trim()}
            >
              Verify
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-center">
          Already have an account?{' '}
          <Link
            to="/operator/sign-in"
            className="text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-10 text-xs text-gray-500">
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
