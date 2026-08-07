import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import {
  OrganizationMemberType,
  PermissionTemplateEnum,
} from '@monorepo/ba-platform/types';
import { Button } from '../base-ui/buttons/buttons';
import { Dropdown } from '../base-ui/dropdown';
import { Input } from '../base-ui/input';
import { AddOrganizationMemberDocument } from './__generated__/addOrganizationMember.generated';
import { FormSchema, TFormSchema, defaultValues } from './formSchema';

const ROLE_OPTIONS = [
  { label: 'Shelter Operator', value: PermissionTemplateEnum.ShelterOperator },
];

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
    control,
    handleSubmit,
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

      <Controller
        name="firstName"
        control={control}
        render={({ field }) => (
          <Input
            label="First Name"
            placeholder="Enter first name"
            dataType="string"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
          />
        )}
      />

      <Controller
        name="lastName"
        control={control}
        render={({ field }) => (
          <Input
            label="Last Name"
            placeholder="Enter last name"
            dataType="string"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label="Email Address"
            placeholder="Enter email address"
            dataType="email"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            required
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="permissionTemplate"
        control={control}
        rules={{ required: 'Role is required.' }}
        render={({ field, fieldState }) => (
          <Dropdown
            label="Role"
            required
            options={ROLE_OPTIONS}
            value={ROLE_OPTIONS.find((o) => o.value === field.value) ?? null}
            onChange={(opt) => field.onChange(opt?.value ?? '')}
            disabled={disabled}
            error={fieldState.error?.message}
          />
        )}
      />

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
