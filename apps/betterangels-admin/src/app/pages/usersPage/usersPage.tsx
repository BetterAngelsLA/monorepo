import { Button, useAlert, useAppDrawer } from '@monorepo/react/components';
import { PlusIcon } from '@monorepo/react/icons';
import { addUserFormConfig } from './addUserFormConfig';

export function UsersPage() {
  const { showDrawer } = useAppDrawer();
  const { showAlert, closeAlert } = useAlert();

  function onShowDrawer() {
    showDrawer(addUserFormConfig);
    showAlert({
      content:
        'hello alert hello alert hello alert hello alert hello alert hello alert hello alert hello alert hello alert',
      type: 'error',
    });
  }

  return (
    <div className="flex w-full p-8">
      <div>Users Page</div>

      <Button
        size="xl"
        variant="accent"
        onClick={onShowDrawer}
        className="ml-auto flex items-center gap-2.5"
      >
        <div className="px-1">
          <PlusIcon className="w-4" />
        </div>
        Add User
      </Button>

      <Button size="xl" variant="accent" onClick={closeAlert} className="mx-4">
        Hide
      </Button>
    </div>
  );
}
