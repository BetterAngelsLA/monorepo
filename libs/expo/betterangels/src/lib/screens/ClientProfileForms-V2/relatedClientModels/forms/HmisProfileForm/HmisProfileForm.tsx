import {
  ControlledInput,
  Form,
  SingleSelect,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { enumDisplayHmisAgency } from '../../../../..//static';
import {
  extractExtensionErrors,
  extractOperationInfo,
} from '../../../../../apollo';
import { applyManualFormErrors } from '../../../../../errors';
import {
  ClientProfileSectionEnum,
  getClientProfileRoute,
} from '../../../../../screenRouting';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { ClientProfileDocument } from '../../../../Client/__generated__/Client.generated';
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

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [updateHmisProfile] = useUpdateHmisProfileMutation();
  const [createHmisProfile] = useCreateHmisProfileMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    clearErrors,
  } = useForm<THmisProfileFormState>({
    defaultValues: defaultFormState,
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
    try {
      setIsLoading(true);

      const mutationVariables = {
        variables: {
          data: {
            clientProfile: clientProfile.id,
            ...formState,
            ...(isEditMode ? { id: relationId } : {}),
          },
        },
      };

      const mutation = isEditMode ? updateHmisProfile : createHmisProfile;

      const response = await mutation({
        ...mutationVariables,
        refetchQueries: [
          {
            query: ClientProfileDocument,
            variables: {
              id: clientProfile.id,
            },
          },
        ],
        errorPolicy: 'all',
      });

      const extensionErrors = extractExtensionErrors(response);

      if (extensionErrors) {
        applyManualFormErrors(extensionErrors, setError);

        return;
      }

      const responseData = response.data;

      if (!responseData) {
        throw 'Missing HMIS mutation response data';
      }

      const uniquenessError = hasUniquenessError(
        responseData,
        isEditMode ? 'updateHmisProfile' : 'createHmisProfile'
      );

      if (uniquenessError) {
        setError('hmisId', { type: 'manual', message: uniquenessError });

        return;
      }

      const returnRoute = getClientProfileRoute({
        id: clientProfile.id,
        openCard: ClientProfileSectionEnum.HmisIds,
      });

      router.replace(returnRoute);
    } catch (error) {
      console.error('Error during mutation:', error);
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

function hasUniquenessError(
  response: UpdateHmisProfileMutation | CreateHmisProfileMutation,
  key: 'updateHmisProfile' | 'createHmisProfile'
): string | null {
  const operationInfo = extractOperationInfo(response, key);

  const messages = operationInfo?.messages;

  if (!messages?.length) {
    return null;
  }

  const uniquenessServerErrorMessage =
    'Hmis profile with this Hmis id and Agency already exists.';

  const uniquenessError = messages.find(
    (m) => m.message === uniquenessServerErrorMessage
  );

  if (uniquenessError) {
    return 'This HMIS ID is already associated with another client.';
  }

  return null;
}
