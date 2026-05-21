import { Input } from '@monorepo/react/shared';
import { FormEvent } from 'react';

interface OtpFormProps {
  otp: string;
  onOtpChange: (value: string) => void;
  loading: boolean;
  resending: boolean;
  errorMsg: string;
  onSubmit: () => void;
  onResend: () => void;
}

export function OtpForm({
  otp,
  onOtpChange,
  loading,
  resending,
  errorMsg,
  onSubmit,
  onResend,
}: OtpFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      <Input
        className="mb-4"
        inputClassname="input-xl"
        label="Verification Code"
        value={otp}
        onChange={(e) => onOtpChange(e.target.value)}
        autoCapitalize="none"
        placeholder="Enter code"
      />

      <p className="mb-4">
        Check your email for the verification code.{' '}
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="font-semibold underline"
        >
          {resending ? 'Sending...' : 'Resend code'}
        </button>
      </p>

      {!!errorMsg && <p className="text-alert-60 text-sm mb-4">{errorMsg}</p>}

      <button
        type="submit"
        className="btn btn-primary btn-xl"
        disabled={loading || !otp.trim()}
      >
        Verify
      </button>
    </form>
  );
}
