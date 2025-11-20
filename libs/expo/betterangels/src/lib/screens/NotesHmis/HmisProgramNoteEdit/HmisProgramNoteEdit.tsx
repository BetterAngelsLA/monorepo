import { useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutationWithErrors } from '@monorepo/apollo';
import { Form, LoadingView } from '@monorepo/expo/shared/ui-components';
import { toLocalCalendarDate } from '@monorepo/expo/shared/utils';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { HmisNoteType, extractExtensionErrors } from '../../../apollo';
import { applyManualFormErrors } from '../../../errors';
import { useSnackbar } from '../../../hooks';
import {
  HmisProgramNoteForm,
  HmisProgramNoteFormSchema,
  HmisProgramNoteFormSchemaOutput,
  THmisProgramNoteFormInputs,
  THmisProgramNoteFormOutputs,
  hmisProgramNoteFormEmptyState,
} from '../HmisProgramNoteForm';
import { HmisNoteDocument } from '../HmisProgramNoteView/__generated__/HmisProgramNoteView.generated';
import { UpdateHmisNoteDocument } from './__generated__/hmisUpdateClientNote.generated';

type TProps = {
  noteHmisId: string;
  clientHmisId: string;
  arrivedFrom?: string;
  onSuccess?: () => void;
};

export function HmisProgramNoteEdit(props: TProps) {
  const { clientHmisId, noteHmisId, onSuccess } = props;

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
  // returnPartialData=true: allow incomplete data from cache
  const {
    data: noteData,
    loading: noteDataLoading,
    error: getNoteNetworkError,
    refetch,
  } = useQuery(HmisNoteDocument, {
    variables: { clientHmisId, noteHmisId },
    fetchPolicy: 'cache-first',
    returnPartialData: true,
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

  const { setError } = formMethods;

  const onSubmit: SubmitHandler<THmisProgramNoteFormInputs> = async (
    values
  ) => {
    if (formDisabled) {
      return;
    }

    try {
      const payload: THmisProgramNoteFormOutputs =
        HmisProgramNoteFormSchemaOutput.parse(values);

      const updateResponse = await updateHmisNoteMutation({
        variables: {
          data: {
            hmisId: noteHmisId,
            hmisClientProfileId: clientHmisId,
            ...payload,
          },
        },

        errorPolicy: 'all',
      });

      if (!updateResponse) {
        throw new Error('missing updateHmisNote response');
      }

      const errorViaExtensions = extractExtensionErrors(updateResponse);

      if (errorViaExtensions) {
        applyManualFormErrors(errorViaExtensions, setError);

        return;
      }

      const otherErrors = updateResponse.errors?.[0];

      if (otherErrors) {
        throw otherErrors.message;
      }

      const result = updateResponse.data?.updateHmisNote;

      if (result?.__typename === 'HmisNoteType') {
        await refetch();
        router.dismissTo(`notes-hmis/${noteHmisId}/index`);
      } else {
        console.log('Unexpected result: ', result);
        showSnackbar({
          message: `Something went wrong!`,
          type: 'error',
        });
        router.replace(`/notes-hmis`);
      }

      if (onSuccess) {
        return onSuccess();
      }
    } catch (error) {
      console.error('updateHmisNoteMutation error:', error);

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
          clientHmisId={clientHmisId}
          disabled={formDisabled}
        />
      </Form.Page>
    </FormProvider>
  );
}
