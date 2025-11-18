import { zodResolver } from '@hookform/resolvers/zod'; // Install this resolver
import { useMutationWithErrors } from '@monorepo/apollo';
import { Button, mergeCss, useAlert } from '@monorepo/react/components';
import { toError } from '@monorepo/react/shared';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { OrganizationMemberType } from '../../apollo/graphql/__generated__/types';
import { extractOperationInfoMessage } from '../../apollo/graphql/response/extractOperationInfoMessage';
import { useUser } from '../../hooks';
import Input from '../Input';
import {
  AddOrganizationMemberDocument,
  AddOrganizationMemberMutation,
} from './__generated__/addOrganizationMember.generated';
import { FormSchema, TFormSchema, defaultValues } from './formSchema';

type TProps = {
  className?: string;
  onComplete?: (invited: OrganizationMemberType) => void;
  onCancel?: () => void;
};

export function AddUserForm(props: TProps) {
  const { className, onComplete, onCancel } = props;

  const { user } = useUser();
  const { showAlert } = useAlert();
  const [disabled, setDisabled] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  const organizationId = user?.organization?.id;

  const [addOrganizationMember] = useMutationWithErrors(
    AddOrganizationMemberDocument
  );

  const onSubmit: SubmitHandler<TFormSchema> = async (values) => {
    if (!organizationId) {
      return;
    }

    setDisabled(true);

    try {
      const response = await addOrganizationMember({
        variables: {
          data: {
            ...values,
            organizationId,
          },
        },
      });

      const errorMessage =
        extractOperationInfoMessage<AddOrganizationMemberMutation>(
          response,
          'addOrganizationMember'
        );

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      const invitedUser = response.data?.addOrganizationMember;

      if (invitedUser?.__typename !== 'OrganizationMemberType') {
        throw new Error('Sorry, something went wrong.');
      }

      onComplete?.(invitedUser);
    } catch (err) {
      const error = toError(err);

      console.error(`error inviting user: ${error.message}`);

      showAlert({
        type: 'error',
        content: error.message,
      });
    } finally {
      setDisabled(false);
    }
  };

  function handleOnCancel() {
    onCancel?.();
  }

  const parentCss = ['flex', 'flex-col', 'w-full', 'h-full', className];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="p-6">
        <Input
          {...register('firstName')}
          disabled={disabled}
          required
          type="text"
          className="mb-4"
          inputClassname="input-md w-96"
          label="First Name"
          placeholder="Enter first name"
          autoCapitalize="none"
          error={errors?.firstName?.message}
        />

        <Input
          {...register('lastName')}
          disabled={disabled}
          required
          type="text"
          className="mb-4"
          inputClassname="input-md w-96"
          label="Last Name"
          placeholder="Enter last name"
          autoCapitalize="none"
          error={errors?.lastName?.message}
        />

        <Input
          {...register('email')}
          disabled={disabled}
          required
          type="email"
          className="mb-4"
          inputClassname="input-md w-96"
          label="Email Address"
          placeholder="Enter email address"
          autoCapitalize="none"
          autoCorrect="off"
          error={errors?.email?.message}
        />
      </div>

      <div className="mt-auto border-t border-neutral-90 p-6 flex justify-end items-center">
        <button
          type="button"
          className="mr-12 text-primary-20 text-base font-semibold"
          onClick={handleOnCancel}
          disabled={disabled}
        >
          Cancel
        </button>

        <Button
          size="2xl"
          variant="accent"
          onClick={handleSubmit(onSubmit)}
          disabled={disabled}
        >
          Add User
        </Button>
      </div>
    </div>
  );
}
