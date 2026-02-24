import { SignIn as SharedSignIn, SignInProps } from '@monorepo/react/shelter';

export default function SignIn() {
  const sharedProps: SignInProps = {
    onSuccessRedirect: '/operator',
    description:
      'Welcome! Sign in for Better Angels and start making a difference in the LA Community.',
  };

  return <SharedSignIn {...sharedProps} />;
}
