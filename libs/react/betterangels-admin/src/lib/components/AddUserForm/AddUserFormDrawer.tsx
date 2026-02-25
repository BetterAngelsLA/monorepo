import { AppDrawer, useAlert, useAppDrawer } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { OrganizationMemberType } from '../../apollo/graphql/__generated__/types';
import { AddUserForm } from './AddUserForm';

type TProps = {
  className?: string;
};

export function AddUserFormDrawer(props: TProps) {
  const { className } = props;

  const { closeDrawer } = useAppDrawer();
  const { showAlert } = useAlert();

  function handleOnComplete(invitedUser: OrganizationMemberType) {
    closeDrawer();

    const { firstName, lastName } = invitedUser;

    showAlert({
      content: `${firstName} ${lastName} has been invited`,
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
          Add User
        </div>
      </AppDrawer.Header>

      <AddUserForm onComplete={handleOnComplete} onCancel={handleOnCancel} />
    </div>
  );
}
