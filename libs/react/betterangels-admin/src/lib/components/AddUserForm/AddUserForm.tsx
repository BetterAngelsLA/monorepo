import { Button, mergeCss } from '@monorepo/react/components';
import { useState } from 'react';
import { useRequiredUser } from '../../hooks';
import Input from '../Input';
import { useAddOrganizationMemberMutation } from './__generated__/addOrganizationMember.generated';

type TProps = {
  className?: string;
  onComplete?: () => void;
  onCancel?: () => void;
};

export function AddUserForm(props: TProps) {
  const { className, onComplete, onCancel } = props;

  const user = useRequiredUser();
  // const { closeDrawer } = useAppDrawer();
  const [disabled, setDisabled] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const orgId = user.organization.id;

  const [addOrganizationMember, { data, loading, error }] =
    useAddOrganizationMemberMutation();

  async function handleOnSubmit() {
    if (!orgId) {
      return;
    }

    setDisabled(true);

    onComplete?.();

    try {
      const { data } = await addOrganizationMember({
        variables: {
          data: {
            firstName,
            lastName,
            email,
            organizationId: orgId,
          },
        },
      });

      console.log();
      console.log('| -------------  data  ------------- |');
      console.log(data);
      console.log();

      // if (!data?.createNote || !('id' in data.createNote)) {
      //   throw new Error('invalid mutation result');
      // }

      // const createdNoteId = data.createNote.id;

      // default behavior
      // router.navigate(`/add-note/${createdNoteId}`);
    } catch (err) {
      // console.error(
      //   `error creating note for profileId [${clientProfileId}]: ${err}`
      // );
      // default behavior
    } finally {
      setDisabled(false);
    }
  }

  function handleOnCancel() {
    console.log('################################### onCancel');
  }

  const parentCss = ['flex', 'flex-col', 'w-full', 'h-full', className];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="p-6">
        <Input
          required
          type="text"
          className="mb-4"
          inputClassname="input-md w-96"
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoCapitalize="none"
          placeholder="Enter first name"
        />

        <Input
          required
          type="text"
          className="mb-4"
          inputClassname="input-md w-96"
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoCapitalize="none"
          placeholder="Enter last name"
        />

        <Input
          required
          type="email"
          className="mb-4"
          inputClassname="input-md w-96"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoCapitalize="none"
          placeholder="Enter email address"
        />
      </div>

      <div className="mt-auto border-t border-neutral-90 p-6 flex justify-end items-center">
        <button
          className="mr-12 text-primary-20 text-base font-semibold"
          onClick={handleOnCancel}
          disabled={disabled}
        >
          Cancel
        </button>

        <Button
          size="2xl"
          variant="accent"
          onClick={handleOnSubmit}
          disabled={disabled}
        >
          Add User
        </Button>
      </div>
    </div>
  );
}
