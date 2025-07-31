import {
  Dropdown,
  useRequiredUser,
  useSignOut,
} from '@monorepo/react/betterangels-admin';

export default function Home() {
  const user = useRequiredUser();
  const { signOut } = useSignOut();

  return (
    <div className="flex items-center justify-center h-screen flex-col">
      <div>Welcome to Home, {user.email}!</div>
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
