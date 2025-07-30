import { Button, useAppDrawer } from '@monorepo/react/components';
import { PlusIcon } from '@monorepo/react/icons';
import { addUserFormConfig } from './addUserFormConfig';

export function UsersPage() {
  const { showDrawer } = useAppDrawer();

  function onShowDrawer() {
    showDrawer(addUserFormConfig);
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
    </div>
  );
}
