import {
  Navbar,
  useSignOut,
  useUser,
} from '@monorepo/react/betterangels-admin';

export default function Home() {
  const { user } = useUser();
  const { signOut } = useSignOut();

  return (
    <div>
      <Navbar />
      <div>Welcome to Home, {user?.email}!</div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
