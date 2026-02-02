import {
  AppDrawer,
  mergeCss,
  useAlert,
  useAppDrawer,
} from '@monorepo/react/components';
import { CurrentUserType } from '@monorepo/react/shelter';
import { EditUserForm } from './EditUserForm';

type TProps = {
  className?: string;
  data: CurrentUserType;
};

export function EditUserFormDrawer(props: TProps) {
  const { className, data } = props;

  const { closeDrawer } = useAppDrawer();
  const { showAlert } = useAlert();

  function handleOnComplete(updatedUser: CurrentUserType) {
    closeDrawer();

    const { firstName, lastName } = updatedUser;

    showAlert({
      content: `${firstName} ${lastName} has been updated`,
      type: 'success',
    });
  }

  function handleOnCancel() {
    closeDrawer();
  }

  const parentCss = ['flex', 'flex-col', 'h-full', className];

  return (
    <div className={mergeCss(parentCss)}>
      <AppDrawer.Header>
        <div className="text-xl font-semibold text-neutral-20 leading-6">
          Edit User
        </div>
      </AppDrawer.Header>

      <EditUserForm
        data={data}
        onComplete={handleOnComplete}
        onCancel={handleOnCancel}
      />
    </div>
  );
}
