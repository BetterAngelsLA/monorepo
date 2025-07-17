import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/sign-in', { state: { from: location }, replace: true });
    }
  }, [user, isLoading, location, navigate]);

  return children;
}
