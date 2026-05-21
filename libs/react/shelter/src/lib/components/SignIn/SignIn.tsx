import {
  Regex,
  useAllauthLogin,
  useAllauthSignup,
} from '@monorepo/react/shared';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiConfig, useUser } from '../../providers';
import { AuthForm } from './AuthForm';
import { LegalFooter } from './LegalFooter';
import { ModeToggle } from './ModeToggle';
import { OtpForm } from './OtpForm';
import './SignIn.css';

export interface SignInProps {
  /** Path to redirect to after successful login */
  onSuccessRedirect: string;
  /** Welcome message description */
  description: string;
  /** Allow toggling to a sign-up form. Defaults to false. */
  allowSignUp?: boolean;
}

export function SignIn({
  onSuccessRedirect,
  description,
  allowSignUp = false,
}: SignInProps) {
  const { fetchClient, apiUrl } = useApiConfig();
  const { refetchUser } = useUser();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const onSuccess = useCallback(async () => {
    await refetchUser();
    navigate(onSuccessRedirect);
  }, [refetchUser, navigate, onSuccessRedirect]);

  const login = useAllauthLogin({ fetchClient, onLoginSuccess: onSuccess });
  const signup = useAllauthSignup({ fetchClient, onSignupSuccess: onSuccess });

  const isPasswordLogin = email.endsWith('@example.com');
  const isValidEmail = Regex.email.test(email);
  const isSignUp = mode === 'sign-up';
  const step = isSignUp ? signup.step : login.step;
  const errorMsg = isSignUp ? signup.errorMsg : login.errorMsg;
  const loading = isSignUp ? signup.loading : login.loading;

  const handleToggleMode = useCallback(() => {
    setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
    setOtp('');
    login.resetStep();
    signup.resetStep();
    login.clearError();
    signup.clearError();
  }, [login, signup]);

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      setOtp('');
      if (isSignUp) {
        signup.resetStep();
      } else {
        login.resetStep();
      }
    },
    [isSignUp, login, signup]
  );

  const handleAuthSubmit = useCallback(() => {
    if (isSignUp) {
      signup.handleSignup({ email, firstName, lastName });
    } else if (isPasswordLogin) {
      login.handlePasswordLogin(email, password);
    } else {
      login.handleSendCode(email);
    }
  }, [
    isSignUp,
    signup,
    login,
    email,
    firstName,
    lastName,
    password,
    isPasswordLogin,
  ]);

  const handleOtpSubmit = useCallback(() => {
    if (isSignUp) {
      signup.handleConfirmCode(otp);
    } else {
      login.handleConfirmCode(otp);
    }
  }, [isSignUp, signup, login, otp]);

  const handleResendCode = useCallback(() => {
    if (isSignUp) {
      return signup.handleResendCode();
    } else {
      return login.handleResendCode();
    }
  }, [isSignUp, signup, login]);

  const resending = isSignUp ? signup.resending : login.resending;

  const showInitialForm =
    (isSignUp && step === 'form') || (!isSignUp && step === 'initial');
  const showOtp = step === 'otp';

  return (
    <div className="bg-neutral-99 flex min-h-screen items-center justify-center">
      <div className="rounded-3xl p-10 flex flex-col bg-white shadow-md w-[460px]">
        <h1 className="font-bold text-2xl mb-2">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h1>
        <p className="mb-10">{description}</p>

        {showInitialForm && (
          <AuthForm
            isSignUp={isSignUp}
            email={email}
            onEmailChange={handleEmailChange}
            firstName={firstName}
            onFirstNameChange={setFirstName}
            lastName={lastName}
            onLastNameChange={setLastName}
            password={password}
            onPasswordChange={setPassword}
            isPasswordLogin={isPasswordLogin}
            isValidEmail={isValidEmail}
            loading={loading}
            errorMsg={errorMsg}
            onSubmit={handleAuthSubmit}
          />
        )}

        {showOtp && (
          <OtpForm
            otp={otp}
            onOtpChange={setOtp}
            loading={loading}
            resending={resending}
            errorMsg={errorMsg}
            onSubmit={handleOtpSubmit}
            onResend={handleResendCode}
          />
        )}

        {allowSignUp && !showOtp && (
          <ModeToggle isSignUp={isSignUp} onToggle={handleToggleMode} />
        )}

        <LegalFooter apiUrl={apiUrl} />
      </div>
    </div>
  );
}
