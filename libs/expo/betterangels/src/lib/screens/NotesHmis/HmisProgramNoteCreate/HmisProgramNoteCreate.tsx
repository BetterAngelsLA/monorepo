import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { extractExtensionFieldErrors } from '../../../apollo/graphql/response/extractExtensionFieldErrors';
import { applyManualFormErrors } from '../../../errors';
import { useSnackbar } from '../../../hooks';
import { CreateTaskDocument } from '../../../ui-components/TaskForm/__generated__/createTask.generated';
import { ClientViewTabEnum } from '../../Client/ClientTabs';
import {
  HmisProgramNoteForm,
  HmisProgramNoteFormSchema,
  HmisProgramNoteFormSchemaOutput,
  THmisProgramNoteFormInputs,
} from '../HmisProgramNoteForm';
import {
  getHmisProgramNoteFormEmptyState,
  HmisNoteFormFieldNames,
} from '../HmisProgramNoteForm/formSchema';
import { CreateHmisNoteDocument } from './__generated__/hmisCreateClientNote.generated';

type TProps = {
  clientId: string;
  arrivedFrom?: string;
};

export function HmisProgramNoteCreate(props: TProps) {
  const { clientId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisNote] = useMutation(CreateHmisNoteDocument);
  const [createTask] = useMutation(CreateTaskDocument);

  const methods = useForm<THmisProgramNoteFormInputs>({
    resolver: zodResolver(HmisProgramNoteFormSchema),
    defaultValues: getHmisProgramNoteFormEmptyState(),
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<THmisProgramNoteFormInputs> = async (
    values
  ) => {
    try {
      // 1. Separate Draft Tasks from the Note fields
      // We do this because 'draftTasks' is not part of the HmisProgramNoteSchemaOutput
      const { draftTasks, ...noteFields } = values;

      // 2. Validate/Parse Note fields
      const payload = HmisProgramNoteFormSchemaOutput.parse(noteFields);

      // 3. Create Note
      const createResponse = await createHmisNote({
        variables: {
          data: {
            hmisClientProfileId: clientId,
            ...payload,
          },
        },
        errorPolicy: 'all',
      });

      const { data, error } = createResponse;

      // Handle Validation Errors
      if (CombinedGraphQLErrors.is(error)) {
        const fieldErrors = extractExtensionFieldErrors(
          error,
          HmisNoteFormFieldNames
        );
        if (fieldErrors.length) {
          applyManualFormErrors(fieldErrors, methods.setError);
          return;
        }
      }

      // Handle Generic Errors
      if (error) {
        throw new Error(error.message);
      }

      const newNote = data?.createHmisNote;

      if (newNote?.__typename !== 'HmisNoteType' || !newNote?.id) {
        throw new Error('Failed to create HMIS Note');
      }

      // 4. Create Tasks (Link to the new Note)
      // Eventually we can move this back to HMIS Note creation
      if (draftTasks?.length > 0) {
        await Promise.all(
          draftTasks.map((task) =>
            createTask({
              variables: {
                data: {
                  summary: task.summary,
                  description: task.description,
                  status: task.status,
                  team: task.team,
                  hmisClientProfile: clientId,
                  hmisNote: newNote.id,
                },
              },
            })
          )
        );
      }

      // 5. Success - Redirect
      router.replace(
        `/client/${clientId}?activeTab=${ClientViewTabEnum.Interactions}`
      );
    } catch (error) {
      console.error('[HmisProgramNoteCreate] error:', error);
      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  return (
    <FormProvider {...methods}>
      <Form.Page
        actionProps={{
          onSubmit: handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: isSubmitting,
        }}
      >
        <HmisProgramNoteForm clientId={clientId} />
      </Form.Page>
    </FormProvider>
  );
}
