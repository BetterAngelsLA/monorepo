import { useEnvironment } from '@monorepo/ba-platform';
import { Regex } from '@monorepo/expo/shared/static';
import { useEffect, useMemo } from 'react';

export type Environment = 'production' | 'demo' | 'local';

/**
 * Hook that automatically switches API environment based on email address.
 *
 * Environment selection logic:
 * - Email contains '+local' → 'local'
 * - Email contains '+demo' or ends with '@example.com' → 'demo'
 * - anything else → 'production'
 *
 * `+local` is checked first because its test address is also an
 * `@example.com` one, which would otherwise read as demo.
 *
 * @param email - The email address to evaluate
 * @returns Object with isValidEmail, and isPasswordLogin
 */
export default function useEmailEnvironment(email: string): {
  isValidEmail: boolean;
  isPasswordLogin: boolean;
} {
  const { switchEnvironment } = useEnvironment();

  const isValidEmail = useMemo(() => Regex.email.test(email), [email]);

  const isPasswordLogin = useMemo(
    () => email.endsWith('@example.com'),
    [email],
  );

  const targetEnv = useMemo<Environment | null>(() => {
    if (!email || !Regex.email.test(email)) {
      return null;
    }
    if (email.includes('+local')) {
      return 'local';
    }
    if (email.includes('+demo') || email.endsWith('@example.com')) {
      return 'demo';
    }
    return 'production';
  }, [email]);

  useEffect(() => {
    if (!isValidEmail || !targetEnv) return;
    switchEnvironment(targetEnv);
  }, [targetEnv, switchEnvironment, isValidEmail]);

  return { isValidEmail, isPasswordLogin };
}
