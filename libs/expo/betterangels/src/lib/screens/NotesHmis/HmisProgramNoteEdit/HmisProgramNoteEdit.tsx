import { zodResolver } from '@hookform/resolvers/zod';
import { Form, LoadingView } from '@monorepo/expo/shared/ui-components';
import { toLocalCalendarDate } from '@monorepo/expo/shared/utils';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { HmisClientNoteType, extractHMISErrors } from '../../../apollo';
import { applyOperationFieldErrors } from '../../../errors';
import { useSnackbar } from '../../../hooks';
import {
  HmisProgramNoteForm,
  HmisProgramNoteFormSchema,
  HmisProgramNoteFormSchemaOutput,
  THmisProgramNoteFormInputs,
  THmisProgramNoteFormOutputs,
  hmisProgramNoteFormEmptyState,
} from '../HmisProgramNoteForm';
import { useHmisGetClientNoteQuery } from './__generated__/hmisGetClientNote.generated';
import { useHmisUpdateClientNoteMutation } from './__generated__/hmisUpdateClientNote.generated';

type TProps = {
  hmisNoteId: string;
  hmisClientId: string;
  hmisNoteEnrollmentId: string;
  arrivedFrom?: string;
  onSuccess?: () => void;
};

export function HmisProgramNoteEdit(props: TProps) {
  const { hmisClientId, hmisNoteEnrollmentId, hmisNoteId, onSuccess } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [existingNote, setExistingNote] = useState<HmisClientNoteType>();
  const [updateHmisClientNoteMutation] = useHmisUpdateClientNoteMutation();

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
  } = useHmisGetClientNoteQuery({
    variables: {
      id: hmisNoteId,
      personalId: hmisClientId,
      enrollmentId: hmisNoteEnrollmentId,
    },
    fetchPolicy: 'cache-first',
    partialRefetch: true,
  });

  useEffect(() => {
    const noteResult = noteData?.hmisGetClientNote;

    if (noteResult?.__typename !== 'HmisClientNoteType') {
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
      enrollmentId: existingNote.enrollment?.enrollmentId ?? '',
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

      const { data } = await updateHmisClientNoteMutation({
        variables: {
          clientNoteInput: {
            id: hmisNoteId,
            personalId: hmisClientId,
            ...payload,
          },
        },

        errorPolicy: 'all',
      });

      const result = data?.hmisUpdateClientNote;

      if (!result) {
        throw new Error('missing hmisUpdateClientNote response');
      }

      if (result?.__typename === 'HmisUpdateClientNoteError') {
        const { message: hmisErrorMessage } = result;

        const { status, fieldErrors = [] } =
          extractHMISErrors(hmisErrorMessage) || {};

        // handle unprocessable_entity errors and exit
        if (status === 422) {
          const formKeys = Object.keys(hmisProgramNoteFormEmptyState);

          const formFieldErrors = fieldErrors.filter(({ field }) =>
            formKeys.includes(field)
          );

          applyOperationFieldErrors(formFieldErrors, setError);

          return;
        }

        // HmisCreateClientError exists but not 422 | 404
        // throw generic error
        throw new Error(hmisErrorMessage);
      }

      if (result?.__typename !== 'HmisClientNoteType') {
        throw new Error('invalid HmisClientNoteType response');
      }

      if (onSuccess) {
        return onSuccess();
      }

      router.dismissTo(`notes-hmis/${hmisNoteId}/index`);
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
          hmisClientId={hmisClientId}
          disabled={formDisabled}
        />
      </Form.Page>
    </FormProvider>
  );
}
