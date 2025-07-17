import { ReactNode, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks';
import { getRouteAccess } from './routeAccess';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    const access = getRouteAccess(location.pathname);
    console.log('Current pathname:', location.pathname);

    console.log(access);

    console.log(
      'Checking access for:',
      location.pathname,
      'Access type:',
      access
    );
    if (access === 'safe' && !user) {
      console.log('Redirecting to sign-in for safe route');
      hasRedirected.current = true;
      navigate('/sign-in', {
        state: { from: location.pathname },
        replace: true,
      });
    }

    if (access === 'unsafe' && user) {
      const from = (location.state as any)?.from || '/';
      hasRedirected.current = true;
      navigate(from, { replace: true });
    }
  }, [user, isLoading, location.pathname, location.state, navigate]);

  return <>{children}</>;
}
