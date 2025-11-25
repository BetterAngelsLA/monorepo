import { useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutationWithErrors } from '@monorepo/apollo';
import { Form, LoadingView } from '@monorepo/expo/shared/ui-components';
import { toLocalCalendarDate } from '@monorepo/expo/shared/utils';
import { useRouter } from 'expo-router';
import { GraphQLError } from 'graphql';
import { useEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { HmisNoteType, extractExtensionErrors } from '../../../apollo';
import { applyManualFormErrors } from '../../../errors';
import { useSnackbar } from '../../../hooks';
import { ClientViewTabEnum } from '../../Client/ClientTabs';
import {
  HmisProgramNoteForm,
  HmisProgramNoteFormSchema,
  HmisProgramNoteFormSchemaOutput,
  THmisProgramNoteFormInputs,
  THmisProgramNoteFormOutputs,
  hmisProgramNoteFormEmptyState,
} from '../HmisProgramNoteForm';
import { HmisNoteDocument } from './__generated__/hmisGetClientNote.generated';
import {
  UpdateHmisNoteDocument,
  UpdateHmisNoteMutation,
} from './__generated__/hmisUpdateClientNote.generated';

type MutationExecResult<TData> = {
  data?: TData | null;
  errors?: readonly GraphQLError[];
};

type TProps = {
  id: string;
  clientId: string;
  arrivedFrom?: string;
  onSuccess?: () => void;
};

export function HmisProgramNoteEdit(props: TProps) {
  const { id, clientId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [existingNote, setExistingNote] = useState<HmisNoteType>();
  const [updateHmisNoteMutation] = useMutationWithErrors(
    UpdateHmisNoteDocument
  );

  const formMethods = useForm<THmisProgramNoteFormInputs>({
    resolver: zodResolver(HmisProgramNoteFormSchema),
    defaultValues: hmisProgramNoteFormEmptyState,
  });

  // Note: we assume cached note is valid and refetch only on missing fields.
  // fetchPolicy=cache-first: use cache unless missing fields in cache
  // partialRefetch=true: refetch if any requested field is missing
  const {
    data: noteData,
    loading: noteDataLoading,
    error: getNoteNetworkError,
    refetch,
  } = useQuery(HmisNoteDocument, {
    variables: { id },
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    const noteResult = noteData?.hmisNote;

    if (noteResult?.__typename !== 'HmisNoteType') {
      return;
    }

    setExistingNote(noteResult);
  }, [noteData]);

  useEffect(() => {
    if (!existingNote) {
      return;
    }

    formMethods.reset({
      ...hmisProgramNoteFormEmptyState,
      title: existingNote.title ?? '',
      date: toLocalCalendarDate(existingNote.date),
      note: existingNote.note ?? '',
    });
  }, [existingNote, formMethods]);

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = formMethods;

  const formDisabled = !existingNote || isSubmitting;

  const onSubmit: SubmitHandler<THmisProgramNoteFormInputs> = async (
    values
  ) => {
    if (formDisabled) {
      return;
    }

    try {
      const payload: THmisProgramNoteFormOutputs =
        HmisProgramNoteFormSchemaOutput.parse(values);

      const updateResponse = (await updateHmisNoteMutation({
        variables: {
          data: {
            id,
            ...payload,
          },
        },
        errorPolicy: 'all',
        refetchQueries: [{ query: HmisNoteDocument, variables: { id } }],
        awaitRefetchQueries: true,
      })) as MutationExecResult<UpdateHmisNoteMutation>;

      if (!updateResponse) {
        throw new Error('missing updateHmisNote response');
      }

      const errorViaExtensions = extractExtensionErrors(updateResponse);

      if (errorViaExtensions) {
        applyManualFormErrors(errorViaExtensions, formMethods.setError);

        return;
      }

      const otherErrors = updateResponse.errors?.[0];

      if (otherErrors) {
        throw otherErrors.message;
      }

      const result = updateResponse.data?.updateHmisNote;

      if (result?.__typename === 'HmisNoteType') {
        await refetch();
        router.replace(
          `/client/${clientId}?activeTab=${ClientViewTabEnum.Interactions}`
        );
      } else {
        console.log('Unexpected result: ', result);
        showSnackbar({
          message: `Something went wrong!`,
          type: 'error',
        });
        router.dismissTo(
          `/client/${clientId}?activeTab=${ClientViewTabEnum.Interactions}`
        );
      }
    } catch (error) {
      console.error('updateHmisClientNoteMutation error:', error);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  if (getNoteNetworkError) {
    console.error('getNoteNetworkError:', getNoteNetworkError);
  }

  if (noteDataLoading) {
    return <LoadingView />;
  }

  return (
    <FormProvider {...formMethods}>
      <Form.Page
        actionProps={{
          onSubmit: handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: formDisabled,
        }}
      >
        <HmisProgramNoteForm
          clientId={clientId}
          disabled={formDisabled}
          editing={true}
        />
      </Form.Page>
    </FormProvider>
  );
}
