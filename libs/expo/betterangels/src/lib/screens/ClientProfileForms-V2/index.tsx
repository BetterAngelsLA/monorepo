import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  KeyboardAwareScrollView,
  LoadingView,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { ReactNode, useEffect, useLayoutEffect } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { UpdateClientProfileInput } from '../../apollo';
import {
  TValidationError,
  applyValidationErrors,
} from '../../helpers/parseClientProfileErrors';
import { useSnackbar } from '../../hooks';
import {
  ClientProfileCardEnum,
  isValidClientProfileCardEnum,
} from '../Client/ClientProfile_V2/constants';
import ContactInfo from './ContactInfo';
import DemographicInfo from './DemographicInfo';
import Fullname from './Fullname';
import HmisId from './HmisId';
import Household from './Household';
import ImportantNotes from './ImportantNotes';
import PersonalInfoForm from './PersonalInfo';
import RelevantContact from './RelevantContact';
import {
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
} from './__generated__/clientProfile.generated';
import { extractClientFormData } from './extractClientFormData';
import { FormStateMapping, FormValues, IClientProfileForms } from './types';

const formConfigs: Record<
  keyof FormStateMapping,
  { title: string; content: ReactNode }
> = {
  [ClientProfileCardEnum.ContactInfo]: {
    title: 'Edit Contact Information',
    content: <ContactInfo />,
  },
  [ClientProfileCardEnum.Demographic]: {
    title: 'Edit Demographic Info',
    content: <DemographicInfo />,
  },
  [ClientProfileCardEnum.FullName]: {
    title: 'Edit Full Name',
    content: <Fullname />,
  },
  [ClientProfileCardEnum.HmisIds]: {
    title: 'Edit HMIS ID',
    content: <HmisId />,
  },
  [ClientProfileCardEnum.Household]: {
    title: 'Edit Household Details',
    content: <Household />,
  },
  [ClientProfileCardEnum.ImportantNotes]: {
    title: 'Edit Important Notes',
    content: <ImportantNotes />,
  },
  [ClientProfileCardEnum.PersonalInfo]: {
    title: 'Edit Personal Info',
    content: <PersonalInfoForm />,
  },
  [ClientProfileCardEnum.RelevantContacts]: {
    title: 'Edit Relevant Contact',
    content: <RelevantContact />,
  },
};

export default function ClientProfileForms(props: IClientProfileForms) {
  const { componentName, id } = props;
  const {
    data,
    error: fetchError,
    loading,
    refetch,
  } = useGetClientProfileQuery({
    variables: { id },
  });

  const [updateClient, { loading: isUpdating }] =
    useUpdateClientProfileMutation();

  const methods = useForm<FormValues>({
    defaultValues: {
      id,
    },
  });

  const navigation = useNavigation();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  if (!isValidClientProfileCardEnum(componentName)) {
    throw new Error(`Invalid componentName "${componentName}" provided.`);
  }

  const validComponentName = componentName as keyof FormStateMapping;
  const config = formConfigs[validComponentName];

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      if (!data || !('clientProfile' in data)) {
        return;
      }

      const inputs = toUpdateClienProfileInputs(id, values);

      if (!inputs) {
        return;
      }

      if ('socialMediaProfiles' in values) {
        inputs.socialMediaProfiles =
          values.socialMediaProfiles?.filter((item) => item.platformUserId) ||
          [];

        inputs.phoneNumbers =
          values.phoneNumbers?.filter((item) => item.number) || [];
      }

      const updateResponse = await updateClient({
        variables: {
          data: inputs,
        },
        errorPolicy: 'all',
      });

      // TODO: Consolidate API Error handling - see ticket DEV-1601
      const errors = updateResponse.errors?.[0];

      const errorViaExtensions = errors?.extensions?.['errors'] as
        | TValidationError[]
        | undefined;

      if (errorViaExtensions) {
        applyValidationErrors(errorViaExtensions, methods.setError);

        return;
      }

      const otherErrors = !errorViaExtensions && errors;

      if (otherErrors) {
        throw otherErrors.message;
      }

      refetch();

      router.replace(`/client/${id}?openCard=${validComponentName}`);
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: 'Sorry, there was an error updating this profile.',
        type: 'error',
      });
    }
  };

  useLayoutEffect(() => {
    if (config) {
      navigation.setOptions({ title: config.title });
    }
  }, [config, navigation]);

  useEffect(() => {
    if (!data || !('clientProfile' in data) || !id) {
      return;
    }

    const formData = extractClientFormData(
      validComponentName,
      data.clientProfile
    );

    methods.reset(formData);
  }, [data, id]);

  if (loading) {
    return <LoadingView />;
  }

  if (fetchError) {
    console.error(fetchError);

    showSnackbar({
      message: 'Something went wrong. Please try again.',
      type: 'error',
    });
  }

  return (
    <FormProvider {...methods}>
      <View style={styles.container}>
        <KeyboardAwareScrollView>{config.content}</KeyboardAwareScrollView>

        <BottomActions
          disabled={isUpdating}
          cancel={
            <TextButton
              disabled={isUpdating}
              onPress={router.back}
              fontSize="sm"
              accessibilityHint={`cancels the update of ${config.title}`}
              title="Cancel"
            />
          }
          onSubmit={methods.handleSubmit(onSubmit)}
        />
      </View>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
  },
});

function toUpdateClienProfileInputs(
  id: string,
  values: FormValues
): UpdateClientProfileInput | null {
  if (!values || !id) {
    return null;
  }

  const updatedInputs: UpdateClientProfileInput = { id };

  // convert dateOfBirth to date string and remove time
  if ('dateOfBirth' in values && values.dateOfBirth) {
    updatedInputs.dateOfBirth = values.dateOfBirth
      .toISOString()
      .split('T')[0] as unknown as Date;
  }

  // profilePhoto is updated directly within component
  if ('profilePhoto' in values) {
    delete values.profilePhoto;
  }

  return {
    ...values,
    ...updatedInputs,
  };
}
