import {
  operatorPath,
  SignIn as SharedSignIn,
  SignInProps,
} from '@monorepo/react/shelter';

export function SignIn() {
  const sharedProps: SignInProps = {
    onSuccessRedirect: operatorPath,
    description:
      'Welcome! Sign in for Better Angels and start making a difference in the LA Community.',
  };

  return <SharedSignIn {...sharedProps} />;
}
