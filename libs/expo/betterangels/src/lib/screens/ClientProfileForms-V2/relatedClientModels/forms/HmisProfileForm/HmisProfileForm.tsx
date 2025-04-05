import {
  ControlledInput,
  Form,
  SingleSelect,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
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
import { HmisProfileDelete } from './HmisProfileDelete';
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

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<THmisProfileFormState>({
    defaultValues: defaultFormState,
  });

  const [updateHmisProfile, { loading: updateLoading }] =
    useUpdateHmisProfileMutation();

  const [createHmisProfile, { loading: createLoading }] =
    useCreateHmisProfileMutation();

  useEffect(() => {
    const { agency, hmisId } = toFormState({ clientProfile, relationId });

    setValue('hmisId', hmisId);
    setValue('agency', agency);
  }, [clientProfile, relationId, setValue]);

  const isEditMode = !!relationId;

  if (!clientProfile) {
    return null;
  }

  const onSubmit: SubmitHandler<THmisProfileFormState> = async (
    formState: any
  ) => {
    try {
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
    }
  };

  const isLoading = updateLoading || createLoading;

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
            onDelete={() => setValue('hmisId', '')}
            error={!!errors.hmisId}
            errorMessage={errors.hmisId?.message}
            rules={{
              required: 'HMIS ID is required',
            }}
          />
        </Form.Fieldset>
      </Form>

      {isEditMode && (
        <HmisProfileDelete
          relationId={relationId}
          clientProfileId={clientProfile.id}
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

  const uniquenessErrorMessage =
    'Hmis profile with this Hmis id and Agency already exists.';

  const uniquenessError = messages.find(
    (m) => m.message === uniquenessErrorMessage
  );

  return uniquenessError?.message || null;
}
