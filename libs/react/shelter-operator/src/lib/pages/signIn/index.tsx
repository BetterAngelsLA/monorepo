import { SignIn as SharedSignIn, SignInProps } from '@monorepo/react/shelter';
import { Link } from 'react-router-dom';

export function SignIn() {
  const sharedProps: SignInProps = {
    onSuccessRedirect: '/operator',
    description:
      'Welcome! Sign in for Better Angels and start making a difference in the LA Community.',
  };

  return (
    <div>
      <SharedSignIn {...sharedProps} />
      <p className="text-center mt-4 text-sm">
        Don&apos;t have an account?{' '}
        <Link to="/operator/sign-up" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
