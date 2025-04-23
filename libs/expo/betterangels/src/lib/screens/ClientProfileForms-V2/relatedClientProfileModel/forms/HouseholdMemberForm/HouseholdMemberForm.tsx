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
  useCreateClientHouseholdMemberMutation,
  useUpdateClientHouseholdMemberMutation,
} from './__generated__/householdMember.generated';
import { processHouseholdMemberForm } from './processHouseholdMemberForm';
import { defaultFormState, toFormState } from './toFormState';
import { THouseholdMemberFormState } from './types';

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function HouseholdMemberForm(props: TProps) {
  const { clientProfile, relationId } = props;

  const router = useRouter();
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

  const [createHouseholdMember] = useCreateClientHouseholdMemberMutation();
  const [updateHouseholdMember] = useUpdateClientHouseholdMemberMutation();
  const [reFetchClientProfile] = useGetClientProfileLazyQuery({
    fetchPolicy: 'network-only',
  });

  if (!clientProfile) {
    return null;
  }

  const clientProfileId = clientProfile.id;

  const isEditMode = !!relationId;

  const onSubmit = async (formData: THouseholdMemberFormState) => {
    if (!formIsValid) {
      return;
    }

    try {
      setIsLoading(true);

      const processed = await processHouseholdMemberForm({
        formData,
        clientProfileId,
        relationId,
        setError,
        createHouseholdMember,
        updateHouseholdMember,
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
          openCard: ClientProfileSectionEnum.Household,
        })
      );
    } catch (e) {
      console.error('Error during mutation:', e);

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
          clientProfileId={clientProfileId}
          setIsLoading={setIsLoading}
          disabled={isLoading}
        />
      )}
    </Form.Page>
  );
}
