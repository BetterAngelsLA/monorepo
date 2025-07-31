import { UserIcon } from '@monorepo/react/icons';
import { useSignOut } from '../hooks';
import Dropdown from './Dropdown';

enum NavbarOption {
  SignOut = 'Sign Out',
}

export default function Navbar() {
  const { signOut } = useSignOut();

  const handleSelect = (option: NavbarOption) => {
    switch (option) {
      case NavbarOption.SignOut:
        signOut();
        break;
      default:
        console.warn(`Unhandled option: ${option}`);
    }
  };
  return (
    <div className="navbar bg-neutral-99 flex justify-end px-6 py-7">
      <Dropdown
        title={
          <div className="h-10 w-10 flex items-center justify-center bg-white rounded-lg border border-neutral-90">
            <UserIcon className="w-6" color="neutral-30" />
          </div>
        }
        options={[NavbarOption.SignOut]}
        onSelect={handleSelect}
      />
    </div>
  );
}
