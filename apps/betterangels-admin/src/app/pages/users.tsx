import {
  useApiConfig,
  useAppDrawerState,
} from '@monorepo/react/betterangels-admin';
import { Button } from '@monorepo/react/components';

export function UsersPage() {
  const [_drawer, setDrawer] = useAppDrawerState();

  const { apiUrl } = useApiConfig();

  console.log();
  console.log('| -------------  apiUrl  ------------- |');
  console.log(apiUrl);
  console.log();

  function onAddUser() {
    console.log('add user click');

    setDrawer({
      content: <div className="p-24">HELLO DRAWER CONTENT</div>,
      placement: 'left',
    });
  }

  return (
    <div className="p-8 w-full">
      <div className="flex flex-row">
        <div>Users Page</div>

        <Button onClick={onAddUser} className="ml-auto">
          Add User
        </Button>
      </div>
    </div>
  );
}
