import { SignIn as SignInComponent, SignInProps } from '../../components';

export default function SignInPage() {
  const sharedProps: SignInProps = {
    onSuccessRedirect: '/users',
    description:
      'Welcome! Sign in for Better Angels and start making a difference in the LA Community.',
  };

  return <SignInComponent {...sharedProps} />;
}
