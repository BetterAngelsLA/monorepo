import { Colors, Regex } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  Form,
  SingleSelect,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useSnackbar } from '../../../../../hooks';
import {
  ClientProfileSectionEnum,
  getViewClientProfileRoute,
} from '../../../../../screenRouting';
import { clientRelevantContactEnumDisplay } from '../../../../../static';
import AddressAutocomplete from '../../../../../ui-components/AddressField';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { useGetClientProfileLazyQuery } from '../../../ClientProfileForm/__generated__/clientProfile.generated';
import { ClientContactDeleteBtn } from '../ClientContactDeleteBtn';
import {
  useCreateClientContactMutation,
  useUpdateClientContactMutation,
} from './__generated__/clientContact.generated';
import { processClientContactForm } from './processClientContactForm';
import { defaultFormState, toFormState } from './toFormState';
import { TClientContactFormState } from './types';

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function ClientContactForm(props: TProps) {
  const { clientProfile, relationId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    formState: { errors, isValid: formIsValid, isSubmitted },
    handleSubmit,
    setError,
    setValue,
    clearErrors,
  } = useForm<TClientContactFormState>({
    defaultValues: defaultFormState,
  });

  useEffect(() => {
    const { name, email, phoneNumber, mailingAddress, relationshipToClient } =
      toFormState({
        clientProfile,
        relationId,
      });

    setValue('name', name);
    setValue('email', email);
    setValue('phoneNumber', phoneNumber);
    setValue('mailingAddress', mailingAddress);
    setValue('relationshipToClient', relationshipToClient);
  }, [clientProfile, relationId, setValue]);

  const [email, phoneNumber, mailingAddress, relationshipToClient] = useWatch({
    control,
    name: ['email', 'phoneNumber', 'mailingAddress', 'relationshipToClient'],
  });

  const oneOfMissingError = !email && !phoneNumber && !mailingAddress;
  const isError = oneOfMissingError || !relationshipToClient;

  const [createContact] = useCreateClientContactMutation();
  const [updateContact] = useUpdateClientContactMutation();
  const [reFetchClientProfile] = useGetClientProfileLazyQuery({
    fetchPolicy: 'network-only',
  });

  if (!clientProfile) {
    return null;
  }

  const clientProfileId = clientProfile.id;

  const isEditMode = !!relationId;

  const onSubmit = async (formData: TClientContactFormState) => {
    if (isError || !formIsValid) {
      return;
    }

    try {
      setIsLoading(true);

      const processed = await processClientContactForm({
        formData,
        clientProfileId,
        relationId,
        setError,
        clearErrors,
        createContact,
        updateContact,
      });

      if (!processed) {
        return;
      }

      await reFetchClientProfile({
        variables: { id: clientProfileId },
      });

      router.replace(
        getViewClientProfileRoute({
          id: clientProfileId,
          openCard: ClientProfileSectionEnum.RelevantContacts,
        })
      );
    } catch (e) {
      console.error('Error updating Relevant Contact:', e);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form.Page
      actionProps={{
        onSubmit: handleSubmit(onSubmit),
        onLeftBtnClick: router.back,
        disabled: isLoading,
      }}
    >
      <TextRegular
        mb="lg"
        color={isSubmitted && isError ? Colors.ERROR : undefined}
      >
        Please select the type of relevant contact and enter at least one form
        of contact information.
      </TextRegular>

      <Form>
        <Form.Fieldset>
          <Controller
            name="relationshipToClient"
            control={control}
            render={({ field: { onChange, value } }) => (
              <SingleSelect
                disabled={isLoading}
                label="Relevant contact type"
                placeholder="Select the relevant contact type"
                items={Object.entries(clientRelevantContactEnumDisplay).map(
                  ([value, displayValue]) => ({ value, displayValue })
                )}
                selectedValue={value}
                onChange={(value) => onChange(value)}
              />
            )}
          />

          <ControlledInput
            name={'name'}
            control={control}
            disabled={isLoading}
            label={'Name'}
            placeholder={'Enter name'}
            onDelete={() => {
              setValue('name', '');
              clearErrors('name');
            }}
            error={!!errors.name}
            errorMessage={errors.name?.message}
          />

          <ControlledInput
            name="email"
            control={control}
            disabled={isLoading}
            label="Email"
            placeholder="Enter email address"
            onDelete={() => {
              setValue('email', '');
              clearErrors('email');
            }}
            error={!!errors.email}
            errorMessage={(errors.email?.message as string) || undefined}
            rules={{
              validate: (value: string) => {
                if (value && !Regex.email.test(value)) {
                  return 'Enter a valid email address';
                }

                return true;
              },
            }}
          />

          <ControlledInput
            name={'phoneNumber'}
            control={control}
            disabled={isLoading}
            label={'Phone Number'}
            placeholder="Enter phone number"
            keyboardType="number-pad"
            onDelete={() => {
              setValue('phoneNumber', '');
              clearErrors('phoneNumber');
            }}
            error={!!errors.phoneNumber}
            errorMessage={errors.phoneNumber?.message}
            rules={{
              validate: (value: string) => {
                if (value && !Regex.phoneNumber.test(value)) {
                  return 'Enter a 10-digit phone number without space or special characters';
                }

                return true;
              },
            }}
          />

          <AddressAutocomplete
            control={control}
            label="Mailing Address"
            name="mailingAddress"
            placeholder="Enter mailing address"
          />
        </Form.Fieldset>
      </Form>

      {isEditMode && (
        <ClientContactDeleteBtn
          relationId={relationId}
          clientProfileId={clientProfileId}
          setIsLoading={setIsLoading}
          disabled={isLoading}
        />
      )}
    </Form.Page>
  );
}
