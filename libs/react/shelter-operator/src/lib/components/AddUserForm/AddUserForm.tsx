import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
  OrganizationMemberType,
  PermissionTemplateEnum,
} from '../../apollo/graphql/__generated__/types';
import { Button } from '../base-ui/buttons/buttons';
import { Input } from '../base-ui/input';
import { AddOrganizationMemberDocument } from './__generated__/addOrganizationMember.generated';
import { FormSchema, TFormSchema, defaultValues } from './formSchema';

type TProps = {
  className?: string;
  onComplete?: (invited: OrganizationMemberType) => void;
  onCancel?: () => void;
  organizationId: string;
};

export function AddUserForm(props: TProps) {
  const { className, onComplete, onCancel, organizationId } = props;

  const [disabled, setDisabled] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  const [addOrganizationMember] = useMutation(AddOrganizationMemberDocument);

  const onSubmit: SubmitHandler<TFormSchema> = async (values) => {
    setDisabled(true);
    setSubmissionError(null);

    try {
      const response = await addOrganizationMember({
        variables: {
          data: {
            ...values,
            organizationId,
          },
        },
        errorPolicy: 'all',
      });

      if (
        response.data?.addOrganizationMember?.__typename === 'OperationInfo'
      ) {
        const firstMessage =
          response.data.addOrganizationMember.messages?.[0]?.message;
        setSubmissionError(
          firstMessage || 'Unable to add user. Please try again.'
        );
        return;
      }

      const invitedUser = response.data?.addOrganizationMember;

      if (invitedUser?.__typename !== 'OrganizationMemberType') {
        setSubmissionError('Sorry, something went wrong.');
        return;
      }

      onComplete?.({
        ...invitedUser,
        isOrgOwner: false,
      } as OrganizationMemberType);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'A network error occurred.';
      console.error(`error inviting user: ${message}`);
      setSubmissionError(message);
    } finally {
      setDisabled(false);
    }
  };

  function handleOnCancel() {
    onCancel?.();
  }

  return (
    <div className={mergeCss(['flex', 'flex-col', 'gap-5', className])}>
      {submissionError && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {submissionError}
        </div>
      )}

      <Input
        {...register('firstName')}
        disabled={disabled}
        label="First Name"
        placeholder="Enter first name"
        dataType="string"
      />

      <Input
        {...register('lastName')}
        disabled={disabled}
        label="Last Name"
        placeholder="Enter last name"
        dataType="string"
      />

      <Input
        {...register('email')}
        disabled={disabled}
        required
        label="Email Address"
        placeholder="Enter email address"
        dataType="email"
        error={errors?.email?.message}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Role</label>
        <select
          {...register('permissionTemplate')}
          disabled={disabled}
          className="h-12 w-full rounded-full border border-gray-200 bg-white px-5 text-sm text-gray-900 outline-none transition-colors duration-200 focus-within:border-[#008CEE]"
        >
          {[PermissionTemplateEnum.ShelterOperator].map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="primary" onClick={handleOnCancel} disabled={disabled}>
          Cancel
        </Button>

        <Button
          variant="primary"
          color="blue"
          onClick={handleSubmit(onSubmit)}
          disabled={disabled}
        >
          Add User
        </Button>
      </div>
    </div>
  );
}
