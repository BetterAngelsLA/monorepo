import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, LoadingView } from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  HmisClientProfileType,
  UpdateHmisClientProfileInput,
  extractExtensionFieldErrors,
  extractOperationFieldErrors,
} from '../../apollo';
import { applyManualFormErrors, applyOperationFieldErrors } from '../../errors';
import { useSnackbar } from '../../hooks';
import { HmisClientProfileDocument } from '../ClientHMIS/__generated__/getHMISClient.generated';
import { UpdateHmisClientProfileDocument } from './__generated__/updateHmisClient.generated';
import { hmisFormConfig, parseAsSectionKeyHMIS } from './basicForms/config';
import { toUpdateHmisClientProfileInput } from './toHMISClientProfileInputs';

type TProps = {
  id: string;
  componentName: string;
};

export function ClientHMISEdit(props: TProps) {
  const { componentName, id } = props;

  const router = useRouter();
  const navigation = useNavigation();
  const { showSnackbar } = useSnackbar();

  const [client, setClient] = useState<HmisClientProfileType>();

  const sectionName = parseAsSectionKeyHMIS(componentName);

  if (!sectionName) {
    throw new Error(`Invalid componentName [${componentName}].`);
  }

  const {
    title: screenTitle,
    Form: SectionForm,
    schema: sectionSchema,
    schemaOutput,
    emptyState,
    dataMapper,
  } = hmisFormConfig[sectionName];

  type TFormValues = z.input<typeof sectionSchema>;
  const sectionFormKeys = Object.keys(sectionSchema.shape);

  const [updateHmisClientProfileMutation, { loading: isUpdating }] =
    useMutation(UpdateHmisClientProfileDocument);

  useLayoutEffect(() => {
    if (screenTitle) {
      navigation.setOptions({ title: screenTitle });
    }
  }, [screenTitle, navigation]);

  const methods = useForm<TFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: emptyState,
  });

  const {
    data: clientData,
    loading: clientDataLoading,
    refetch,
  } = useQuery(HmisClientProfileDocument, {
    variables: { id },
  });

  useEffect(() => {
    const client = clientData?.hmisClientProfile;

    if (client?.__typename !== 'HmisClientProfileType') {
      return;
    }

    setClient(client);

    const mappedValues = dataMapper(client);

    methods.reset({
      ...mappedValues,
    });
  }, [clientData, id]);

  if (clientDataLoading) {
    return <LoadingView />;
  }

  const onSubmit: SubmitHandler<TFormValues> = async (values) => {
    try {
      if (!client) {
        return;
      }

      const formValues = schemaOutput
        ? schemaOutput.parse(values)
        : (values as Partial<UpdateHmisClientProfileInput>);

      const inputs = toUpdateHmisClientProfileInput(client, formValues);

      if (!inputs) {
        return;
      }

      const { data, error } = await updateHmisClientProfileMutation({
        variables: {
          data: inputs,
        },
        errorPolicy: 'all',
      });

      // handle OperationInfo validation errors
      const opsValidationErrors = extractOperationFieldErrors({
        data,
        dataKey: 'updateHmisClientProfile',
        fieldNames: sectionFormKeys,
      });

      if (opsValidationErrors.length) {
        applyOperationFieldErrors(opsValidationErrors, methods.setError);

        return;
      }

      // handle GQL extension validation errors
      if (CombinedGraphQLErrors.is(error)) {
        const fieldErrors = extractExtensionFieldErrors(error, sectionFormKeys);

        if (fieldErrors?.length) {
          applyManualFormErrors(fieldErrors, methods.setError);

          return;
        }
      }

      // throw unahandled errors
      if (error) {
        throw error;
      }

      const result = data?.updateHmisClientProfile;

      if (result?.__typename !== 'HmisClientProfileType') {
        throw new Error(`Unexpected result: ${result}`);
      }

      await refetch();

      router.dismissTo(`/client/${result.id}`);
    } catch (error) {
      console.error('updateHmisClientProfileMutation error:', error);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <Form.Page
        actionProps={{
          onSubmit: methods.handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: isUpdating || methods.formState.isSubmitting,
        }}
      >
        <SectionForm />
      </Form.Page>
    </FormProvider>
  );
}
