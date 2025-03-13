import { Spacings } from '@monorepo/expo/shared/static';
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
import { applyValidationErrors } from '../../helpers/parseClientProfileErrors';
import { useSnackbar } from '../../hooks';
import {
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
} from './__generated__/clientProfile.generated';
import ContactInfo from './ContactInfo';
import DemographicInfo from './DemographicInfo';
import { extractClientFormData } from './extractClientFormData';
import Fullname from './Fullname';
import HmisId from './HmisId';
import Household from './Household';
import ImportantNote from './ImportantNote';
import PersonalInfo from './PersonalInfo';
import RelevantContact from './RelevantContact';
import {
  FormStateMapping,
  FormValues,
  IClientProfileForms,
  TValidationError,
} from './types';

const formConfigs: Record<
  keyof FormStateMapping,
  { title: string; content: ReactNode }
> = {
  contactInfo: {
    title: 'Edit Contact Information',
    content: <ContactInfo />,
  },
  demographicInfo: {
    title: 'Edit Demographic Details',
    content: <DemographicInfo />,
  },
  fullname: {
    title: 'Edit Full Name',
    content: <Fullname />,
  },
  hmisId: {
    title: 'Edit HMIS ID',
    content: <HmisId />,
  },
  household: {
    title: 'Edit Household Details',
    content: <Household />,
  },
  importantNote: {
    title: 'Edit Important Note',
    content: <ImportantNote />,
  },
  personalInfo: {
    title: 'Edit Personal Information',
    content: <PersonalInfo />,
  },
  relevantContact: {
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

  const allowedKeys = Object.keys(formConfigs);

  if (!allowedKeys.includes(componentName)) {
    throw new Error(`Invalid componentName "${componentName}" provided.`);
  }

  const validComponentName = componentName as keyof FormStateMapping;
  const config = formConfigs[validComponentName];

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      if (!data || !('clientProfile' in data)) {
        return;
      }

      const input = {
        ...values,
        id,
      };

      const updateResponse = await updateClient({
        variables: {
          data: input,
        },
        errorPolicy: 'all',
      });

      const operationErrors = updateResponse.errors?.[0].extensions?.[
        'errors'
      ] as TValidationError[] | undefined;

      if (operationErrors) {
        applyValidationErrors(operationErrors, methods.setError);
        return;
      }

      refetch();
      router.replace(`/client/${id}`);
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
      componentName as keyof FormStateMapping,
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
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
  },
});
