import { useRequiredUser } from '@monorepo/react/betterangels-admin';

export default function Home() {
  const user = useRequiredUser();

  return (
    <div className="flex items-center justify-center h-full bg-white flex-col">
      <div>Welcome to Home, {user.email}!</div>
    </div>
  );
}
