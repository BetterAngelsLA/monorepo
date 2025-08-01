import {
  DrawerHeader,
  mergeCss,
  useAlert,
  useDrawer,
} from '@monorepo/react/components';
import { AddUserForm } from './AddUserForm';

type TProps = {
  className?: string;
};

export function AddUserFormDrawer(props: TProps) {
  const { className } = props;

  const { closeDrawer } = useDrawer();
  const { showAlert } = useAlert();

  function handleOnComplete() {
    closeDrawer();

    showAlert({
      content: 'User has been invited',
      type: 'success',
    });
  }

  function handleOnCancel() {
    closeDrawer();
  }

  const parentCss = ['flex', 'flex-col', 'h-full', className];

  return (
    <div className={mergeCss(parentCss)}>
      <DrawerHeader>
        <div className="text-xl font-semibold text-neutral-20 leading-6">
          Add User
        </div>
      </DrawerHeader>

      <AddUserForm onComplete={handleOnComplete} onCancel={handleOnCancel} />
    </div>
  );
}
