interface LegalFooterProps {
  apiUrl: string;
}

export function LegalFooter({ apiUrl }: LegalFooterProps) {
  return (
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
  );
}
