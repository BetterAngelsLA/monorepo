import { Regex } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  DatePicker,
  Form,
  SingleSelect,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { extractExtensionErrors } from '../../../../../apollo';
import { applyManualFormErrors } from '../../../../../errors';
import { useSnackbar } from '../../../../../hooks';
import {
  ClientProfileSectionEnum,
  getViewClientProfileRoute,
} from '../../../../../screenRouting';
import {
  clientHouseholdMemberEnumDisplay,
  enumDisplayGender,
} from '../../../../../static';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { useGetClientProfileLazyQuery } from '../../../ClientProfileForm/__generated__/clientProfile.generated';
import { HouseholdMemeberDeleteBtn } from '../HouseholdMemeberDeleteBtn';
import {
  CreateClientHouseholdMemberMutation,
  UpdateClientHouseholdMemberMutation,
  useCreateClientHouseholdMemberMutation,
  useUpdateClientHouseholdMemberMutation,
} from './__generated__/householdMember.generated';
import { defaultFormState, toFormState } from './toFormState';
import { THouseholdMemberFormState } from './types';

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function HouseholdMemeberForm(props: TProps) {
  const { clientProfile, relationId } = props;

  const router = useRouter();
  const [updateHouseholdMember] = useUpdateClientHouseholdMemberMutation();
  const [createHouseholdMember] = useCreateClientHouseholdMemberMutation();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid: formIsValid },
    setError,
    setValue,
    clearErrors,
  } = useForm<THouseholdMemberFormState>({
    defaultValues: defaultFormState,
  });

  const [reFetchClientProfile] = useGetClientProfileLazyQuery({
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    const { name, dateOfBirth, gender, relationshipToClient } = toFormState({
      clientProfile,
      relationId,
    });

    setValue('name', name);
    setValue('gender', gender);
    setValue('dateOfBirth', dateOfBirth);
    setValue('relationshipToClient', relationshipToClient);
  }, [clientProfile, relationId, setValue]);

  if (!clientProfile) {
    return null;
  }

  const isEditMode = !!relationId;

  const onSubmit: SubmitHandler<THouseholdMemberFormState> = async (
    formState: any
  ) => {
    if (!formIsValid) {
      return;
    }

    const apiInputs = toApiInputs(formState);

    if (!apiInputs) {
      return;
    }

    try {
      setIsLoading(true);

      const mutationVariables = {
        variables: {
          data: {
            clientProfile: clientProfile.id,
            ...apiInputs,
            ...(isEditMode ? { id: relationId } : {}),
          },
        },
      };

      const mutation = isEditMode
        ? updateHouseholdMember
        : createHouseholdMember;

      const response = await mutation({
        ...mutationVariables,
        errorPolicy: 'all',
      });

      const extensionErrors = extractExtensionErrors(response);

      if (extensionErrors) {
        applyManualFormErrors(extensionErrors, setError);

        return;
      }

      const responseData = response.data;

      if (!responseData) {
        throw new Error('Missing Household member mutation response data');
      }

      if (!isSuccessMutationResponse(responseData)) {
        throw new Error('invalid response');
      }

      // refetch only on success
      await reFetchClientProfile({
        variables: { id: clientProfile.id },
      });

      const returnRoute = getViewClientProfileRoute({
        id: clientProfile.id,
        openCard: ClientProfileSectionEnum.Household,
      });

      router.replace(returnRoute);
    } catch (error) {
      console.error('Error during mutation:', error);

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
      <TextRegular mb="lg">
        Please select the type of household member and enter the following info.
      </TextRegular>

      <Form>
        <Form.Fieldset>
          <Controller
            name="relationshipToClient"
            control={control}
            render={({ field }) => (
              <SingleSelect
                disabled={isLoading}
                label="Type of Household Member"
                placeholder="Select type of household member"
                items={Object.entries(clientHouseholdMemberEnumDisplay).map(
                  ([value, displayValue]) => ({ value, displayValue })
                )}
                selectedValue={field.value}
                onChange={(value) => field.onChange(value)}
                error={errors.relationshipToClient?.message}
              />
            )}
          />

          <ControlledInput
            control={control}
            disabled={isLoading}
            label={'Name'}
            name={'name'}
            placeholder={'Enter name'}
            onDelete={() => {
              setValue('name', '');
              clearErrors('name');
            }}
            errorMessage={errors.name?.message}
          />

          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <SingleSelect
                disabled={isLoading}
                label="Gender"
                placeholder="Select Gender"
                items={Object.entries(enumDisplayGender).map(
                  ([value, displayValue]) => ({ value, displayValue })
                )}
                selectedValue={field.value}
                onChange={(value) => field.onChange(value)}
                error={errors.gender?.message}
              />
            )}
          />

          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Date of birth"
                disabled={isLoading}
                maxDate={new Date()}
                pattern={Regex.date}
                mode="date"
                format="MM/dd/yyyy"
                placeholder="Enter date of Birth"
                minDate={new Date('1900-01-01')}
                mt="xs"
                value={field.value}
                setValue={(date) => setValue('dateOfBirth', date)}
              />
            )}
          />
        </Form.Fieldset>
      </Form>

      {isEditMode && (
        <HouseholdMemeberDeleteBtn
          relationId={relationId}
          clientProfileId={clientProfile.id}
          setIsLoading={setIsLoading}
          disabled={isLoading}
        />
      )}
    </Form.Page>
  );
}

function isSuccessMutationResponse(
  responseData:
    | UpdateClientHouseholdMemberMutation
    | CreateClientHouseholdMemberMutation
): boolean {
  const modelTypename = 'ClientHouseholdMemberType';

  if ('updateClientHouseholdMember' in responseData) {
    const typename = responseData.updateClientHouseholdMember.__typename;

    if (typename === modelTypename) {
      return true;
    }
  }

  if ('createClientHouseholdMember' in responseData) {
    const typename = responseData.createClientHouseholdMember.__typename;

    if (typename === modelTypename) {
      return true;
    }
  }

  return false;
}

function toApiInputs(values: THouseholdMemberFormState) {
  const { name, gender, dateOfBirth, relationshipToClient } = values || {};

  if (!name && !gender && !dateOfBirth && !relationshipToClient) {
    return null;
  }

  // convert dateOfBirth to date string and remove time
  if ('dateOfBirth' in values && values.dateOfBirth) {
    values.dateOfBirth = values.dateOfBirth
      .toISOString()
      .split('T')[0] as unknown as Date;
  }

  return values;
}
