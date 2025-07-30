import { UserIcon } from '@monorepo/react/icons';
import { useSignOut } from '../hooks';
import Dropdown from './Dropdown';

export default function Navbar() {
  const { signOut } = useSignOut();
  return (
    <div className="navbar bg-neutral-99 flex justify-end px-6 py-7 z-0 absolute top-0 right-0 left-0">
      <Dropdown
        title={
          <div className="h-10 w-10 flex items-center justify-center bg-white rounded-lg border border-neutral-90">
            <UserIcon className="w-6" color="neutral-30" />
          </div>
        }
        options={['Sign Out']}
        onSelect={(option) => {
          switch (option) {
            case 'Sign Out':
              signOut();
              break;
            default:
              console.warn(`No action for: ${option}`);
          }
        }}
      />
    </div>
  );
}
