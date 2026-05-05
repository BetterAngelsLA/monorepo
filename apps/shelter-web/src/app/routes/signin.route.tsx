import { SignIn, shelterHomePath } from '@monorepo/react/shelter';

export function SignInRoute() {
  return (
    <SignIn
      onSuccessRedirect={shelterHomePath}
      description="Sign in with your Better Angels account to access privately shared shelters."
    />
  );
}
