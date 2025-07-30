import {
  Dropdown,
  Navbar,
  useSignOut,
  useUser,
} from '@monorepo/react/betterangels-admin';

export default function Home() {
  const { user } = useUser();
  const { signOut } = useSignOut();

  return (
    <div className="flex items-center justify-center h-screen flex-col">
      <Navbar />
      <div>Welcome to Home, {user?.email}!</div>
      <button onClick={signOut}>Sign Out</button>
      <Dropdown
        title="Click me"
        className="text-white"
        options={['Option 1', 'Option 2']}
        onSelect={(option) => console.log('Selected:', option)}
      />
    </div>
  );
}
