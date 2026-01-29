import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Regex } from '@monorepo/expo/shared/static';
import { useEffect, useMemo } from 'react';

export type Environment = 'production' | 'demo';

/**
 * Hook that automatically switches API environment based on email address.
 *
 * Environment selection logic:
 * - Email contains '+demo' or ends with '@example.com' → 'demo'
 *
 * @param email - The email address to evaluate
 * @returns Object with isValidEmail, and isPasswordLogin
 */
export default function useEmailEnvironment(email: string): {
  isValidEmail: boolean;
  isPasswordLogin: boolean;
} {
  const { switchEnvironment } = useApiConfig();

  const isValidEmail = useMemo(() => Regex.email.test(email), [email]);

  const isPasswordLogin = useMemo(
    () => email.endsWith('@example.com'),
    [email]
  );

  const targetEnv = useMemo<Environment | null>(() => {
    // Don't compute target environment for empty/invalid emails
    if (!email || !Regex.email.test(email)) {
      return null;
    }
    if (email.includes('+demo') || email.endsWith('@example.com')) {
      return 'demo';
    }
    return 'production';
  }, [email]);

  useEffect(() => {
    // Only switch environment when we have a valid email AND computed target
    if (!isValidEmail || !targetEnv) return;
    switchEnvironment(targetEnv);
  }, [targetEnv, switchEnvironment, isValidEmail]);

  return { isValidEmail, isPasswordLogin };
}
