import { SignIn } from '@monorepo/react/betterangels-admin';
import { apiUrl } from '../../../config';

export default function SignInPage() {
  return <SignIn apiUrl={apiUrl} />;
}
