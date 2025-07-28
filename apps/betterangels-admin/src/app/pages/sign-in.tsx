import { SignIn } from '@monorepo/react/betterangels-admin';
import { apiUrl } from '../../../config';

export default function SignInPage() {
  if (!apiUrl || typeof apiUrl !== 'string') {
    throw new Error(
      'VITE_BETTERANGELS_ADMIN_API_URL is not defined in your environment variables.'
    );
  }
  return <SignIn apiUrl={apiUrl} />;
}
