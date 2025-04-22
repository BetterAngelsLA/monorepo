// HouseholdMemeberForm.tsx

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
import { Controller, useForm } from 'react-hook-form';
import { useSnackbar } from '../../../../../hooks';
import {
  clientHouseholdMemberEnumDisplay,
  enumDisplayGender,
} from '../../../../../static';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { HmisProfileDeleteBtn } from '../HmisProfileDeleteBtn';
import { defaultFormState, toFormState } from './toFormState';
// import {
//   CreateHmisProfileMutation,
//   UpdateHmisProfileMutation,
//   useCreateHmisProfileMutation,
//   useUpdateHmisProfileMutation,
// } from './__generated__/hmisProfile.generated';
// import { defaultFormState, toFormState } from './toFormState';
// import { THmisProfileFormState } from './types';

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function HouseholdMemeberForm(props: TProps) {
  const { clientProfile, relationId } = props;

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  //   const [updateHmisProfile] = useUpdateHmisProfileMutation();
  //   const [createHmisProfile] = useCreateHmisProfileMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid: formIsValid },
    setError,
    setValue,
    clearErrors,
  } = useForm<any>({
    defaultValues: defaultFormState,
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

  // const onSubmit: SubmitHandler<THouseholdMemberFormState> = async (
  //   formState: any
  // ) => {
  //   if (!formIsValid) {
  //     return;
  //   }

  //   const validFormState = formState as Required<THouseholdMemberFormState>;

  //   try {
  //     setIsLoading(true);

  //     const mutationVariables = {
  //       variables: {
  //         data: {
  //           clientProfile: clientProfile.id,
  //           ...validFormState,
  //           ...(isEditMode ? { id: relationId } : {}),
  //         },
  //       },
  //     };

  //     const mutation = isEditMode ? updateHmisProfile : createHmisProfile;
  //     const mutationKey = isEditMode
  //       ? 'updateHmisProfile'
  //       : 'createHmisProfile';

  //     const response = await mutation({
  //       ...mutationVariables,
  //       errorPolicy: 'all',
  //     });

  //     const extensionErrors = extractExtensionErrors(response);

  //     if (extensionErrors) {
  //       applyManualFormErrors(extensionErrors, setError);

  //       return;
  //     }

  //     const responseData = response.data;

  //     if (!responseData) {
  //       throw new Error('Missing HMIS mutation response data');
  //     }

  //     const uniquenessError = hasUniquenessError(responseData, mutationKey);

  //     if (uniquenessError) {
  //       setError('hmisId', { type: 'manual', message: uniquenessError });

  //       return;
  //     }

  //     if (!isSuccessMutationResponse(responseData)) {
  //       throw new Error('invalid response');
  //     }

  //     // refetch only on success
  //     await mutation({
  //       ...mutationVariables,
  //       refetchQueries: [
  //         {
  //           query: ClientProfileDocument,
  //           variables: {
  //             id: clientProfile.id,
  //           },
  //         },
  //       ],
  //       errorPolicy: 'all',
  //     });

  //     const returnRoute = getViewClientProfileRoute({
  //       id: clientProfile.id,
  //       openCard: ClientProfileSectionEnum.HmisIds,
  //     });

  //     router.replace(returnRoute);
  //   } catch (error) {
  //     console.error('Error during mutation:', error);

  //     showSnackbar({
  //       message: 'Something went wrong. Please try again.',
  //       type: 'error',
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <Form.Page
      actionProps={{
        // onSubmit: handleSubmit(onSubmit),
        onSubmit: () => {},
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
            // rules={{ required: 'Type of HMIS ID is required' }}
            render={({ field }) => (
              <SingleSelect
                disabled={isLoading}
                label="Type of Household Member"
                placeholder="Select type of Household Member"
                items={Object.entries(clientHouseholdMemberEnumDisplay).map(
                  ([value, displayValue]) => ({ value, displayValue })
                )}
                selectedValue={field.value}
                onChange={(value) => field.onChange(value)}
                // error={errors.agency ? errors.agency.message : undefined}
              />
            )}
          />

          <Controller
            name="gender"
            control={control}
            // rules={{ required: 'Type of HMIS ID is required' }}
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
                // error={errors.agency ? errors.agency.message : undefined}
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
              // clearErrors('name');
            }}
            // error={!!errors.name}
            // errorMessage={errors.hmisId?.message}
            // rules={{
            //   required: 'HMIS ID is required',
            // }}
          />

          <Controller
            name="dateOfBirth"
            control={control}
            // rules={{ required: 'Type of HMIS ID is required' }}
            render={({ field }) => (
              <DatePicker
                label="Date of Birth"
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
        <HmisProfileDeleteBtn
          relationId={relationId}
          clientProfileId={clientProfile.id}
          setIsLoading={setIsLoading}
          disabled={isLoading}
        />
      )}
    </Form.Page>
  );
}

// function isSuccessMutationResponse(
//   responseData: UpdateHmisProfileMutation | CreateHmisProfileMutation
// ): boolean {
//   const modelTypename = 'HmisProfileType';

//   if ('updateHmisProfile' in responseData) {
//     const typename = responseData.updateHmisProfile.__typename;

//     if (typename === modelTypename) {
//       return true;
//     }
//   }

//   if ('createHmisProfile' in responseData) {
//     const typename = responseData.createHmisProfile.__typename;

//     if (typename === modelTypename) {
//       return true;
//     }
//   }

//   return false;
// }

// function hasUniquenessError(
//   response: UpdateHmisProfileMutation | CreateHmisProfileMutation,
//   key: 'updateHmisProfile' | 'createHmisProfile'
// ): string | null {
//   const operationInfo = extractOperationInfo(response, key);

//   const operationMessages = operationInfo?.messages;

//   if (!operationMessages?.length) {
//     return null;
//   }

//   const uniquenessServerErrorMessage =
//     'Hmis profile with this Hmis id and Agency already exists.';

//   const uniquenessError = operationMessages.find(
//     (m) => m.message === uniquenessServerErrorMessage
//   );

//   if (uniquenessError) {
//     return 'This HMIS ID is already associated with another client.';
//   }

//   return null;
// }
