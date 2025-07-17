import { useEffect } from 'react';
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

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/sign-in', { state: { from: location }, replace: true });
    }
  }, [user, isLoading, location, navigate]);

  if (isLoading) return null;

  return children;
}
