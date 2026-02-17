import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ControlledInput, Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import type { UpdateUserProfileInput } from '../../../apollo';
import { extractExtensionFieldErrors } from '../../../apollo/graphql/response/extractExtensionFieldErrors';
import { applyManualFormErrors } from '../../../errors';
import { useSnackbar, useUser } from '../../../hooks';
import { UpdateUserProfileDocument } from './__generated__/UpdateUserProfile.generated';
import { formFieldNames, FormSchema, type TFormSchema } from './formSchema';

type TProps = { id: string };

export function UserProfileEdit(props: TProps) {
  const { id } = props;
  const { user } = useUser();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [updateUserProfile] = useMutation(UpdateUserProfileDocument);

  const methods = useForm<TFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
      });
    }
  }, [user, reset]);

  const onSubmit: SubmitHandler<TFormSchema> = async (values) => {
    try {
      const data: UpdateUserProfileInput = {
        id,
        firstName: values.firstName.trim() || undefined,
        lastName: values.lastName.trim() || undefined,
      };

      const { data: result, error } = await updateUserProfile({
        variables: { data },
        errorPolicy: 'all',
      });

      if (CombinedGraphQLErrors.is(error)) {
        const fieldErrors = extractExtensionFieldErrors(error, formFieldNames);
        if (fieldErrors.length) {
          applyManualFormErrors(fieldErrors, setError);
          return;
        }
      }

      if (error) {
        throw error;
      }

      const payload = (
        result as { updateUserProfile?: { __typename?: string } }
      )?.updateUserProfile;
      if (payload?.__typename === 'CurrentUserType') {
        showSnackbar({ message: 'Profile updated.', type: 'success' });
        router.back();
      } else {
        showSnackbar({
          message: 'Something went wrong. Please try again.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('[UserProfileEdit]', err);
      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <FormProvider {...methods}>
      <Form.Page
        actionProps={{
          onSubmit: handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: isSubmitting,
        }}
      >
        <Form.Fieldset>
          <ControlledInput
            name="firstName"
            required
            control={control}
            disabled={isSubmitting}
            label="First name"
            placeholder="Enter first name"
            errorMessage={methods.formState.errors.firstName?.message}
          />
          <ControlledInput
            name="lastName"
            required
            control={control}
            disabled={isSubmitting}
            label="Last name"
            placeholder="Enter last name"
            errorMessage={methods.formState.errors.lastName?.message}
          />
        </Form.Fieldset>
      </Form.Page>
    </FormProvider>
  );
}
