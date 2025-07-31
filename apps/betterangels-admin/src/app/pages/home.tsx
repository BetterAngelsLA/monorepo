import { useUser } from '@monorepo/react/betterangels-admin';

export default function Home() {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-center h-full bg-white flex-col">
      <div>Welcome to Home, {user?.email}!</div>
    </div>
  );
}
