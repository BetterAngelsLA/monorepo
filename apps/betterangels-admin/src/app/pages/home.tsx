import {
  Dropdown,
  useSignOut,
  useUser,
} from '@monorepo/react/betterangels-admin';

export default function Home() {
  const { user } = useUser();
  const { signOut } = useSignOut();

  return (
    <div>
      <div>Welcome to Home, {user?.email}!</div>
      <button onClick={signOut}>Sign Out</button>
      <Dropdown
        title="Click me"
        options={['Option 1', 'Option 2']}
        onSelect={(option) => console.log('Selected:', option)}
      />
    </div>
  );
}
