import { Form, LoadingView } from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { HmisClientType, extractHMISErrors } from '../../apollo';
import { applyOperationFieldErrors } from '../../errors';
import { useSnackbar } from '../../hooks';
import {
  GetHmisClientDocument,
  useGetHmisClientQuery,
} from '../ClientHMIS/__generated__/getHMISClient.generated';
import { useHmisUpdateClientMutation } from './__generated__/updateHmisClient.generated';
import {
  SectionDefaults,
  SectionForms,
  SectionSchemas,
  SectionTitle,
  makeResolver,
  mapClientToForm,
  parseAsSectionKeyHMIS,
} from './basicForms/config';
import {
  TUpdateClientInputsUnion,
  toHMISClientProfileInputs,
} from './toHMISClientProfileInputs';
import { AnySectionValues } from './types';

type TProps = {
  id: string;
  componentName: string;
};

export function ClientHMISEdit(props: TProps) {
  const { componentName, id: personalId } = props;

  const router = useRouter();
  const navigation = useNavigation();
  const { showSnackbar } = useSnackbar();

  const [client, setClient] = useState<HmisClientType>();

  const sectionName = parseAsSectionKeyHMIS(componentName);
  const [updateHmisClientMutation, { loading: isUpdating }] =
    useHmisUpdateClientMutation();

  const debugMode = process.env['EXPO_PUBLIC_GQL_DEBUG'] === 'true';

  if (!sectionName) {
    throw new Error(`Invalid componentName [${componentName}].`);
  }

  const screenTitle = SectionTitle[sectionName];

  useLayoutEffect(() => {
    if (screenTitle) {
      navigation.setOptions({ title: screenTitle });
    }
  }, [screenTitle, navigation]);

  const formMethods = useForm<AnySectionValues>({
    resolver: makeResolver(sectionName),
    defaultValues: SectionDefaults[sectionName],
  });

  const { data: clientData, loading: clientDataLoading } =
    useGetHmisClientQuery({
      variables: { personalId },
    });

  useEffect(() => {
    const client = clientData?.hmisGetClient;

    if (client?.__typename !== 'HmisClientType') {
      return;
    }

    const valid = clientData?.hmisGetClient.__typename === 'HmisClientType';

    if (!valid) {
      return;
    }

    setClient(client);

    const mappedValues = mapClientToForm(sectionName, client);

    formMethods.reset({
      ...mappedValues,
    });
  }, [clientData, personalId]);

  if (clientDataLoading) {
    return <LoadingView />;
  }

  const sectionSchema = SectionSchemas[sectionName];

  const onSubmit: SubmitHandler<z.infer<typeof sectionSchema>> = async (
    values
  ) => {
    try {
      if (!client) {
        return;
      }

      const currentFormKeys = sectionSchema.keyof().options as string[];

      const { clientInput, clientSubItemsInput } = toHMISClientProfileInputs(
        client,
        currentFormKeys,
        values as TUpdateClientInputsUnion
      );

      const { data: updateData, errors } = await updateHmisClientMutation({
        variables: {
          clientInput,
          clientSubItemsInput,
        },
        errorPolicy: 'all',
        // TODO: replace with cache typePolicy or push directly to cache
        refetchQueries: [
          { query: GetHmisClientDocument, variables: { personalId } },
        ],
        awaitRefetchQueries: true,
      });

      if (debugMode && errors) {
        console.error(errors); // raw error
        console.log(JSON.stringify(errors, null, 2)); // parsed error
      }

      const updatedClient = updateData?.hmisUpdateClient;

      if (!updatedClient) {
        throw new Error('missing hmisUpdateClient response');
      }

      if (updatedClient.__typename === 'HmisUpdateClientError') {
        const { message: hmisErrorMessage } = updatedClient;

        const parsedErr = extractHMISErrors(hmisErrorMessage) || {};

        const { status, fieldErrors = [] } = parsedErr;

        if (debugMode) {
          console.error(updatedClient); // raw error
          console.log(JSON.stringify(parsedErr, null, 2)); // parsed error
        }

        if (status === 422) {
          const formFieldErrors = fieldErrors.filter(({ field }) =>
            currentFormKeys.includes(field)
          );

          applyOperationFieldErrors(formFieldErrors, formMethods.setError);

          // Note:
          // 1. returned field keys are returned in multiple formats (snake + camel)
          // 2. returned keys may be inconsistent with form (nameQuality vs nameDataQuality)
          // 3. perhaps may receive 422 errors for fields not in form (not currentFormKeys)
          return;
        }

        // HmisUpdateClientError exists but not 422
        // throw generic error
        throw new Error(hmisErrorMessage);
      }

      if (updatedClient.__typename !== 'HmisClientType') {
        throw new Error('invalid hmisUpdateClient response');
      }

      const { personalId: returnedId } = updatedClient;

      router.replace(`/client/${returnedId}`);
    } catch (error) {
      console.error('updateHmisClientMutation error:', error);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  const FormContent = SectionForms[sectionName];

  return (
    <FormProvider {...formMethods}>
      <Form.Page
        actionProps={{
          onSubmit: formMethods.handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: isUpdating || formMethods.formState.isSubmitting,
        }}
      >
        <FormContent />
      </Form.Page>
    </FormProvider>
  );
}
