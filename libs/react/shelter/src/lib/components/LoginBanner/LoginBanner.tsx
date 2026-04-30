import { CloseIcon } from '@monorepo/react/icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInPath } from '../../constants';

const STORAGE_KEY = 'shelter-login-banner-dismissed';

export function LoginBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  if (dismissed) {
    return null;
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  }

  return (
    <div className="absolute top-2 left-4 right-4 z-10 flex items-center justify-between gap-3 bg-primary-95 px-4 py-3 rounded-lg shadow-md">
      <p className="text-sm text-primary-20">
        <Link to={signInPath} className="font-semibold underline">
          Sign in
        </Link>{' '}
        with your Better Angels account to access privately shared shelters.
      </p>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss sign-in notification"
        className="shrink-0 p-1"
      >
        <CloseIcon className="w-4 h-4 text-primary-40" />
      </button>
    </div>
  );
}
