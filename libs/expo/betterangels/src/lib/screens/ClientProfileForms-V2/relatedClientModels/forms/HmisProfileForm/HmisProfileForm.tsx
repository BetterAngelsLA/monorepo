import {
  ControlledInput,
  Form,
  SingleSelect,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { enumDisplayHmisAgency } from '../../../../..//static';
import { HmisAgencyEnum } from '../../../../../apollo';
import {
  ClientProfileSectionEnum,
  getClientProfileRoute,
} from '../../../../../screenRouting';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { ClientProfileDocument } from '../../../../Client/__generated__/Client.generated';
import { HmisProfileDelete } from './HmisProfileDelete';
import {
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
    setValue,
  } = useForm<THmisProfileFormState>({
    defaultValues: defaultFormState,
  });

  const [updateHmisProfile, { loading: updateLoading, error: updateError }] =
    useUpdateHmisProfileMutation();

  const [createHmisProfile, { loading: createLoading, error: createError }] =
    useCreateHmisProfileMutation();

  const isEditMode = !!relationId;

  const [agencyValue] = useWatch({
    control,
    name: ['agency'],
  });

  useEffect(() => {
    const { agency, hmisId } = toFormState({ clientProfile, relationId });

    setValue('hmisId', hmisId);
    setValue('agency', agency);
  }, [clientProfile, relationId, setValue]);

  if (!clientProfile) {
    return null;
  }

  const onSubmit: SubmitHandler<THmisProfileFormState> = async (
    formState: any
  ) => {
    try {
      const mutationResult = isEditMode
        ? await updateHmisProfile({
            variables: {
              data: {
                ...formState,
                clientProfile: clientProfile.id,
                id: relationId,
              },
            },
            refetchQueries: [
              {
                query: ClientProfileDocument,
                variables: {
                  id: clientProfile.id,
                },
              },
            ],
            errorPolicy: 'all',
          })
        : await createHmisProfile({
            variables: {
              data: {
                ...formState,
                clientProfile: clientProfile.id,
              },
            },
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

      // if (updateError || createError) {
      //   throw updateError || createError;
      // }

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
          <SingleSelect
            // disabled={isLoading}
            label="Type of HMIS ID"
            placeholder="Select type of HMIS ID"
            items={Object.entries(enumDisplayHmisAgency).map(
              ([value, displayValue]) => ({ value, displayValue })
            )}
            selectedValue={agencyValue}
            onChange={(value) => setValue('agency', value as HmisAgencyEnum)}
            error={errors.agency ? 'agency is required' : undefined}
          />

          <ControlledInput
            control={control}
            disabled={isLoading}
            label={'HMIS ID'}
            name={'hmisId'}
            placeholder={'Enter HMIS ID'}
            onDelete={() => setValue('hmisId', '')}
            error={!!errors.hmisId}
            errorMessage={errors.hmisId && 'HMIS ID is required'}
            rules={{
              required: true,
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
