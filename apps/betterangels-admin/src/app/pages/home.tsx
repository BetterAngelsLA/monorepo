import { useUser } from '@monorepo/react/betterangels-admin';

export default function Home() {
  const { user } = useUser();
  return <div>Welcome to Home, {user?.email}! </div>;
}
