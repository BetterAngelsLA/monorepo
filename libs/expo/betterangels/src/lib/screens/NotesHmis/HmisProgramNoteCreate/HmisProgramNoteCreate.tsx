import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { extractExtensionFieldErrors, UpdateTaskInput } from '../../../apollo';
import { applyManualFormErrors } from '../../../errors';
import { useSnackbar } from '../../../hooks';
import { ClientViewTabEnum } from '../../Client/ClientTabs';
import {
  HmisProgramNoteForm,
  HmisProgramNoteFormSchema,
  HmisProgramNoteFormSchemaOutput,
  THmisProgramNoteFormInputs,
  THmisProgramNoteFormOutputs,
} from '../HmisProgramNoteForm';
import {
  getHmisProgramNoteFormEmptyState,
  HmisNoteFormFieldNames,
} from '../HmisProgramNoteForm/formSchema';
import { CreateHmisNoteDocument } from './__generated__/hmisCreateClientNote.generated';

// IMPORTS
import { NoteTasks } from '../../../ui-components';
import { CreateTaskDocument } from '../../../ui-components/TaskForm/__generated__/createTask.generated';

type TProps = {
  clientId: string;
  arrivedFrom?: string;
};

export function HmisProgramNoteCreate(props: TProps) {
  const { clientId } = props;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const scrollRef = useRef<ScrollView>(null);

  const [createHmisNote] = useMutation(CreateHmisNoteDocument);
  const [createTask] = useMutation(CreateTaskDocument);

  const [draftTasks, setDraftTasks] = useState<UpdateTaskInput[]>([]);

  const methods = useForm<THmisProgramNoteFormInputs>({
    resolver: zodResolver(HmisProgramNoteFormSchema),
    defaultValues: getHmisProgramNoteFormEmptyState(),
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<THmisProgramNoteFormInputs> = async (
    values
  ) => {
    try {
      const payload: THmisProgramNoteFormOutputs =
        HmisProgramNoteFormSchemaOutput.parse(values);

      // 1. Create Note (Get ID)
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
      if (error) throw new Error(error.message);

      const newNote = data?.createHmisNote;
      if (newNote?.__typename !== 'HmisNoteType' || !newNote?.id) {
        throw new Error('Failed to create HMIS Note');
      }

      // 2. Create Tasks (Link to Note)
      if (draftTasks.length > 0) {
        await Promise.all(
          draftTasks.map((task) =>
            createTask({
              variables: {
                data: {
                  summary: task.summary || '',
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

      // 3. Redirect
      router.replace(
        `/client/${clientId}?activeTab=${ClientViewTabEnum.Interactions}`
      );
    } catch (error) {
      console.error('[HmisProgramNoteCreate] error:', error);
      showSnackbar({ message: 'Something went wrong.', type: 'error' });
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
        <NoteTasks
          clientProfileId={clientId}
          scrollRef={scrollRef}
          onDraftTasksChange={setDraftTasks}
        />
      </Form.Page>
    </FormProvider>
  );
}
