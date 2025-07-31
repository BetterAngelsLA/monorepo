import {
  AppDrawer,
  mergeCss,
  useAlert,
  useAppDrawer,
} from '@monorepo/react/components';
import { AddUserForm } from './AddUserForm';

type TProps = {};

export function AddUserFormDrawer() {
  const { closeDrawer } = useAppDrawer();
  const { showAlert } = useAlert();

  function handleOnComplete() {
    closeDrawer();

    showAlert({
      content: 'User has been invited',
      type: 'success',
    });
  }

  function handleOnCancel() {
    console.log('################################### onCancel');
  }

  const parentCss = ['flex', 'flex-col', 'h-full'];

  return (
    <div className={mergeCss(parentCss)}>
      <AppDrawer.Header>
        <div className="text-xl font-semibold text-neutral-20 leading-6">
          Add User
        </div>
      </AppDrawer.Header>

      <AddUserForm onComplete={handleOnComplete} />
    </div>
  );
}
