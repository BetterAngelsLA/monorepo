import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod'; // Install this resolver
import { Button, mergeCss, useAlert } from '@monorepo/react/components';
import { toError } from '@monorepo/react/shared';
import { CurrentUserType } from '@monorepo/react/shelter';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { extractOperationInfoMessage } from '../../apollo/graphql/response/extractOperationInfoMessage';
import Input from '../Input';
import { UpdateCurrentUserDocument } from './__generated__/updateCurrentUser.generated';
import { FormSchema, TFormSchema, defaultValues } from './formSchema';

type TProps = {
  className?: string;
  onComplete?: (updated: CurrentUserType) => void;
  onCancel?: () => void;
  data: CurrentUserType;
};

export function EditUserForm(props: TProps) {
  const { className, onComplete, onCancel, data } = props;

  const { showAlert } = useAlert();
  const [disabled, setDisabled] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  const [updateCurrentUser] = useMutation(UpdateCurrentUserDocument);

  const onSubmit: SubmitHandler<TFormSchema> = async (values) => {
    if (!data.id) {
      return;
    }

    setDisabled(true);

    try {
      const response = await updateCurrentUser({
        variables: {
          data: {
            id: data?.id,
            ...values,
          },
        },
      });

      const errorMessage = extractOperationInfoMessage(
        response,
        'updateCurrentUser'
      );

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      const updatedUser = response.data?.updateCurrentUser;

      if (updatedUser?.__typename !== 'CurrentUserType') {
        throw new Error('Sorry, something went wrong.');
      }

      onComplete?.(updatedUser);
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

  useEffect(() => {
    reset(data);
  }, [data, reset]);

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
          disabled
          required
          type="email"
          className="mb-4"
          inputClassname="input-md w-96"
          label="Email Address"
          placeholder="Enter email address"
          autoCapitalize="none"
          autoCorrect="off"
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
          Save
        </Button>
      </div>
    </div>
  );
}
