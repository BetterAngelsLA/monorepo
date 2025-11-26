import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, LoadingView } from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { GraphQLError } from 'graphql';
import { useEffect, useLayoutEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  extractResponseExtensions,
  HmisClientProfileType,
  UpdateHmisClientProfileInput,
} from '../../apollo';
import { applyManualFormErrors } from '../../errors';
import { useSnackbar } from '../../hooks';
import { HmisClientProfileDocument } from '../ClientHMIS/__generated__/getHMISClient.generated';
import {
  UpdateHmisClientProfileDocument,
  UpdateHmisClientProfileMutation,
} from './__generated__/updateHmisClient.generated';
import { hmisFormConfig, parseAsSectionKeyHMIS } from './basicForms/config';
import { toUpdateHmisClientProfileInput } from './toHMISClientProfileInputs';

type MutationExecResult<TData> = {
  data?: TData | null;
  errors?: readonly GraphQLError[];
};

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

      const formValues = schemaOutput ? schemaOutput.parse(values) : values;

      const inputs = toUpdateHmisClientProfileInput(
        client,
        formValues as UpdateHmisClientProfileInput
      );

      if (!inputs) {
        return;
      }

      const updateResponse = (await updateHmisClientProfileMutation({
        variables: {
          data: inputs,
        },
        errorPolicy: 'all',
        refetchQueries: [
          { query: HmisClientProfileDocument, variables: { id } },
        ],
        awaitRefetchQueries: true,
      })) as MutationExecResult<UpdateHmisClientProfileMutation>;

      if (!updateResponse) {
        throw new Error('missing updateHmisClientProfile response');
      }

      const errorViaExtensions = extractResponseExtensions(updateResponse);

      if (errorViaExtensions) {
        applyManualFormErrors(errorViaExtensions, methods.setError);

        return;
      }

      const otherErrors = updateResponse.errors?.[0];

      if (otherErrors) {
        throw otherErrors.message;
      }

      const result = updateResponse.data?.updateHmisClientProfile;

      if (result?.__typename === 'HmisClientProfileType') {
        await refetch();

        router.dismissTo(`/client/${result.id}`);
      } else {
        console.log('Unexpected result: ', result);
        showSnackbar({
          message: `Something went wrong!`,
          type: 'error',
        });
      }
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
