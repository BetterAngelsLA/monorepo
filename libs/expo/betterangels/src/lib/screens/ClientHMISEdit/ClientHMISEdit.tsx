import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, LoadingView } from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { GraphQLError } from 'graphql';
import { useEffect, useLayoutEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  HmisClientProfileType,
  UpdateHmisClientProfileInput,
} from '../../apollo';
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
  const { componentName, id: hmisId } = props;

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
    emptyState,
    dataMapper,
  } = hmisFormConfig[sectionName];

  type TFormValues = z.input<typeof sectionSchema>;

  const [updateHmisClientProfileMutation, { loading: isUpdating }] =
    useMutation(UpdateHmisClientProfileDocument);

  const debugMode = process.env['EXPO_PUBLIC_GQL_DEBUG'] === 'true';

  useLayoutEffect(() => {
    if (screenTitle) {
      navigation.setOptions({ title: screenTitle });
    }
  }, [screenTitle, navigation]);

  const formMethods = useForm<TFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: emptyState,
  });

  const { data: clientData, loading: clientDataLoading } = useQuery(
    HmisClientProfileDocument,
    {
      variables: { hmisId },
    }
  );

  useEffect(() => {
    const client = clientData?.hmisClientProfile;

    if (client?.__typename !== 'HmisClientProfileType') {
      return;
    }

    const valid =
      clientData?.hmisClientProfile.__typename === 'HmisClientProfileType';

    if (!valid) {
      return;
    }

    setClient(client);

    const mappedValues = dataMapper(client);

    formMethods.reset({
      ...mappedValues,
    });
  }, [clientData, hmisId]);

  if (clientDataLoading) {
    return <LoadingView />;
  }
  const onSubmit: SubmitHandler<TFormValues> = async (values) => {
    try {
      if (!client) {
        return;
      }

      // const currentFormKeys = sectionSchema.keyof().options as string[];

      const inputs = toUpdateHmisClientProfileInput(
        hmisId,
        values as UpdateHmisClientProfileInput
      );

      if (!inputs) {
        return;
      }

      const { data: updateData, errors } =
        (await updateHmisClientProfileMutation({
          variables: {
            data: inputs,
          },
          errorPolicy: 'all',
          refetchQueries: [
            { query: HmisClientProfileDocument, variables: { hmisId } },
          ],
          awaitRefetchQueries: true,
        })) as MutationExecResult<UpdateHmisClientProfileMutation>;

      if (debugMode && errors) {
        console.error(errors); // raw error
        console.log(JSON.stringify(errors, null, 2)); // parsed error
      }

      const updatedClient = updateData?.updateHmisClientProfile;

      if (!updatedClient) {
        throw new Error('missing updateHmisClientProfile response');
      }

      // if (updatedClient.__typename === 'HmisUpdateClientError') {
      //   const { message: hmisErrorMessage } = updatedClient;

      //   const parsedErr = extractHMISErrors(hmisErrorMessage) || {};

      //   const { status, fieldErrors = [] } = parsedErr;

      //   if (debugMode) {
      //     console.error(updatedClient); // raw error
      //     console.log(JSON.stringify(parsedErr, null, 2)); // parsed error
      //   }

      //   if (status === 422) {
      //     const formFieldErrors = fieldErrors.filter(({ field }) =>
      //       currentFormKeys.includes(field)
      //     );

      //     applyOperationFieldErrors(formFieldErrors, formMethods.setError);

      //     // Note:
      //     // 1. returned field keys are returned in multiple formats (snake + camel)
      //     // 2. returned keys may be inconsistent with form (nameQuality vs nameDataQuality)
      //     // 3. perhaps may receive 422 errors for fields not in form (not currentFormKeys)
      //     return;
      //   }

      //   // HmisUpdateClientError exists but not 422
      //   // throw generic error
      //   throw new Error(hmisErrorMessage);
      // }

      if (updatedClient.__typename !== 'HmisClientProfileType') {
        throw new Error('invalid updateHmisClientProfile response');
      }

      const { hmisId: returnedId } = updatedClient;

      router.dismissTo(`/client/${returnedId}`);
    } catch (error) {
      console.error('updateHmisClientProfileMutation error:', error);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <FormProvider {...formMethods}>
      <Form.Page
        actionProps={{
          onSubmit: formMethods.handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: isUpdating || formMethods.formState.isSubmitting,
        }}
      >
        <SectionForm />
      </Form.Page>
    </FormProvider>
  );
}
