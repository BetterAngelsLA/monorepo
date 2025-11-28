import { SignIn as SharedSignIn, SignInProps as SharedSignInProps } from '@monorepo/react/shared';

export default function SignIn() {
  const sharedProps: SharedSignInProps = {
    onSuccessRedirect: '/operator',
    description: 'Welcome! Sign in for Better Angels and start making a difference in the LA Community.'
  };

  return <SharedSignIn {...sharedProps} />;
}
