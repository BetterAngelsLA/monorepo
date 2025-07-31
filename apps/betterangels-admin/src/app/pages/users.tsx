import { AddUserFormDrawer } from '@monorepo/react/betterangels-admin';
import { Button, useAppDrawer } from '@monorepo/react/components';
import { PlusIcon } from '@monorepo/react/icons';
import PageLayout from '../Layout/PageLayout';

export function UsersPage() {
  const { showDrawer } = useAppDrawer();

  function onShowDrawer() {
    showDrawer({
      content: <AddUserFormDrawer />,
      contentClassName: 'p-0',
    });
  }

  return (
    <PageLayout>
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
    </PageLayout>
  );
}
