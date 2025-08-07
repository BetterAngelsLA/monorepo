import { useUser } from '@monorepo/react/betterangels-admin';

export default function Home() {
  const { user } = useUser();
  return (
    <div className="flex items-center justify-center h-full bg-white flex-col">
      {user?.canAccessOrgPortal && <div>Welcome to Home, {user?.email}!</div>}
      {!user?.canAccessOrgPortal && (
        <div>You don't have permission to access this service.</div>
      )}
    </div>
  );
}
