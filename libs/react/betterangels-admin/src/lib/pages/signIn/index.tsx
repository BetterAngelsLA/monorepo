import { SignIn as SharedSignIn, SignInProps as SharedSignInProps } from '@monorepo/react/shared';
import { useApiConfig } from '../../providers';
import { useUser } from '../../hooks';

export interface SignInProps {
  /** Path to redirect to after successful login */
  onSuccessRedirect?: string;
  /** Welcome message title */
  title?: string;
  /** Welcome message description */
  description?: string;
}

export default function SignIn(props: SignInProps) {
  const { fetchClient, apiUrl } = useApiConfig();
  const { refetchUser } = useUser();

  const sharedProps: SharedSignInProps = {
    ...props,
    apiUrl,
    fetchClient,
    refetchUser,
  };

  return <SharedSignIn {...sharedProps} />;
}
