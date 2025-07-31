import { AddUserForm } from '@monorepo/react/betterangels-admin';
import { TAppDrawerAtomProps } from '@monorepo/react/components';

export const addUserFormConfig: TAppDrawerAtomProps = {
  content: <AddUserForm />,
  visible: true,
  header: (
    <div className="text-xl font-semibold text-neutral-20 leading-6">
      Add User
    </div>
  ),
  contentClassName: 'p-0',
  // footer: 'hello footer',
  // placement: 'right',
  // placement: 'left',
};
