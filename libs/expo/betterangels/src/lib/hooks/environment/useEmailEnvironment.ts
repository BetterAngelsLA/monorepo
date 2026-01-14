import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Regex } from '@monorepo/expo/shared/static';
import { useEffect, useMemo } from 'react';

export type Environment = 'production' | 'demo';

/**
 * Hook that automatically switches API environment based on email address.
 *
 * Environment selection logic:
 * - Email contains '+demo' or ends with '@example.com' → 'demo'
 * - Otherwise → uses the provided defaultEnv
 *
 * @param email - The email address to evaluate
 * @param defaultEnv - The environment to use when email doesn't match special patterns (default: 'production')
 * @returns Object with targetEnv, isValidEmail, and isPasswordLogin
 */
export default function useEmailEnvironment(
  email: string,
  defaultEnv: Environment = 'production'
): { targetEnv: Environment; isValidEmail: boolean; isPasswordLogin: boolean } {
  const { environment, switchEnvironment } = useApiConfig();

  const isValidEmail = useMemo(() => Regex.email.test(email), [email]);

  const isPasswordLogin = useMemo(
    () => email.endsWith('@example.com'),
    [email]
  );

  const targetEnv = useMemo<Environment>(() => {
    if (email.includes('+demo') || email.endsWith('@example.com')) {
      return 'demo';
    }
    return defaultEnv;
  }, [email, defaultEnv]);

  useEffect(() => {
    if (!isValidEmail) return;
    switchEnvironment(targetEnv);
  }, [email, environment, targetEnv, switchEnvironment, isValidEmail]);

  return { targetEnv, isValidEmail, isPasswordLogin };
}
