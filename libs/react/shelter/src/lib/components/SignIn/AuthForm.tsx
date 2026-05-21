import { Input } from '@monorepo/react/shared';
import { FormEvent } from 'react';

interface AuthFormProps {
  isSignUp: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  firstName: string;
  onFirstNameChange: (value: string) => void;
  lastName: string;
  onLastNameChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  isPasswordLogin: boolean;
  isValidEmail: boolean;
  loading: boolean;
  errorMsg: string;
  onSubmit: () => void;
}

export function AuthForm({
  isSignUp,
  email,
  onEmailChange,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  password,
  onPasswordChange,
  isPasswordLogin,
  isValidEmail,
  loading,
  errorMsg,
  onSubmit,
}: AuthFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const isDisabled =
    loading ||
    !isValidEmail ||
    (!isSignUp && isPasswordLogin && !password) ||
    (isSignUp && (!firstName.trim() || !lastName.trim()));

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      {isSignUp && (
        <>
          <Input
            className="mb-4"
            inputClassname="input-xl"
            label="First Name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="First name"
          />
          <Input
            className="mb-4"
            inputClassname="input-xl"
            label="Last Name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Last name"
          />
        </>
      )}

      <Input
        className="mb-4"
        inputClassname="input-xl"
        label="Email Address"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        autoCapitalize="none"
        placeholder="you@example.com"
      />

      {!isSignUp && isPasswordLogin && (
        <Input
          className="mb-4"
          inputClassname="input-xl"
          label="Password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          type="password"
          placeholder="Password"
        />
      )}

      {!!errorMsg && <p className="text-alert-60 text-sm mb-4">{errorMsg}</p>}

      <button
        type="submit"
        className="btn btn-primary btn-xl"
        disabled={isDisabled}
      >
        {isSignUp ? 'Create Account' : 'Sign In'}
      </button>
    </form>
  );
}
