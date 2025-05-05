import { FetchResult } from '@apollo/client';
import {
  ControlledInput,
  Form,
  SingleSelect,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import {
  extractExtensionErrors,
  extractOperationInfo,
} from '../../../../../apollo';
import { applyManualFormErrors } from '../../../../../errors';
import { useSnackbar } from '../../../../../hooks';
import {
  ClientProfileSectionEnum,
  getViewClientProfileRoute,
} from '../../../../../screenRouting';
import { enumDisplayHmisAgency } from '../../../../../static';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { useGetClientProfileLazyQuery } from '../../../ClientProfileForm/__generated__/clientProfile.generated';
import { HmisProfileDeleteBtn } from '../HmisProfileDeleteBtn';
import {
  CreateHmisProfileMutation,
  UpdateHmisProfileMutation,
  useCreateHmisProfileMutation,
  useUpdateHmisProfileMutation,
} from './__generated__/hmisProfile.generated';
import { defaultFormState, toFormState } from './toFormState';
import { THmisProfileFormState } from './types';

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function HmisProfileForm(props: TProps) {
  const { clientProfile, relationId } = props;

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [updateHmisProfile] = useUpdateHmisProfileMutation();
  const [createHmisProfile] = useCreateHmisProfileMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid: formIsValid },
    setError,
    setValue,
    clearErrors,
  } = useForm<THmisProfileFormState>({
    defaultValues: defaultFormState,
  });

  const [reFetchClientProfile] = useGetClientProfileLazyQuery({
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    const { agency, hmisId } = toFormState({ clientProfile, relationId });

    setValue('hmisId', hmisId);
    setValue('agency', agency);
  }, [clientProfile, relationId, setValue]);

  if (!clientProfile) {
    return null;
  }

  const isEditMode = !!relationId;

  const onSubmit: SubmitHandler<THmisProfileFormState> = async (
    formState: any
  ) => {
    if (!formIsValid) {
      return;
    }

    const validFormState = formState as Required<THmisProfileFormState>;

    try {
      setIsLoading(true);

      const mutationVariables = {
        variables: {
          data: {
            clientProfile: clientProfile.id,
            ...validFormState,
            ...(isEditMode ? { id: relationId } : {}),
          },
        },
      };

      const mutation = isEditMode ? updateHmisProfile : createHmisProfile;
      const mutationKey = isEditMode
        ? 'updateHmisProfile'
        : 'createHmisProfile';

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
        throw new Error('Missing HMIS mutation response data');
      }

      const uniquenessError = hasUniquenessError(response, mutationKey);

      if (uniquenessError) {
        setError('hmisId', { type: 'manual', message: uniquenessError });

        return;
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
        openCard: ClientProfileSectionEnum.HmisIds,
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
      <TextRegular mb="lg">Fill in both HIMIS ID Type and ID#</TextRegular>
      <Form>
        <Form.Fieldset>
          <Controller
            name="agency"
            control={control}
            rules={{ required: 'Type of HMIS ID is required' }}
            render={({ field }) => (
              <SingleSelect
                disabled={isLoading}
                label="Type of HMIS ID"
                placeholder="Select type of HMIS ID"
                items={Object.entries(enumDisplayHmisAgency).map(
                  ([value, displayValue]) => ({ value, displayValue })
                )}
                selectedValue={field.value}
                onChange={(value) => field.onChange(value)}
                error={errors.agency ? errors.agency.message : undefined}
              />
            )}
          />

          <ControlledInput
            control={control}
            disabled={isLoading}
            label={'HMIS ID'}
            name={'hmisId'}
            placeholder={'Enter HMIS ID'}
            onDelete={() => {
              setValue('hmisId', '');
              clearErrors('hmisId');
            }}
            error={!!errors.hmisId}
            errorMessage={errors.hmisId?.message}
            rules={{
              required: 'HMIS ID is required',
            }}
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

function isSuccessMutationResponse(
  responseData: UpdateHmisProfileMutation | CreateHmisProfileMutation
): boolean {
  const modelTypename = 'HmisProfileType';

  if ('updateHmisProfile' in responseData) {
    const typename = responseData.updateHmisProfile.__typename;

    if (typename === modelTypename) {
      return true;
    }
  }

  if ('createHmisProfile' in responseData) {
    const typename = responseData.createHmisProfile.__typename;

    if (typename === modelTypename) {
      return true;
    }
  }

  return false;
}

function hasUniquenessError(
  response: FetchResult<UpdateHmisProfileMutation | CreateHmisProfileMutation>,
  key: 'updateHmisProfile' | 'createHmisProfile'
): string | null {
  const operationInfo = extractOperationInfo(response, key);

  const operationMessages = operationInfo?.messages;

  if (!operationMessages?.length) {
    return null;
  }

  const uniquenessServerErrorMessage =
    'Constraint “unique_hmis_id_agency” is violated.';

  const uniquenessError = operationMessages.find(
    (m) => m.message === uniquenessServerErrorMessage
  );

  if (uniquenessError) {
    return 'This HMIS ID is already associated with another client.';
  }

  return null;
}
