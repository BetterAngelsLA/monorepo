import { zodResolver } from '@hookform/resolvers/zod';
import { useMutationWithErrors } from '@monorepo/apollo';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { extractExtensionErrors } from '../../../apollo';
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
import { getHmisProgramNoteFormEmptyState } from '../HmisProgramNoteForm/formSchema';
import { CreateHmisNoteDocument } from './__generated__/hmisCreateClientNote.generated';

type TProps = {
  clientId: string;
  arrivedFrom?: string;
};

export function HmisProgramNoteCreate(props: TProps) {
  const { clientId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisNote] = useMutationWithErrors(CreateHmisNoteDocument);

  const formMethods = useForm<THmisProgramNoteFormInputs>({
    resolver: zodResolver(HmisProgramNoteFormSchema),
    defaultValues: getHmisProgramNoteFormEmptyState(),
  });

  const { setError } = formMethods;

  const onSubmit: SubmitHandler<THmisProgramNoteFormInputs> = async (
    values
  ) => {
    try {
      const payload: THmisProgramNoteFormOutputs =
        HmisProgramNoteFormSchemaOutput.parse(values);

      const createResponse = await createHmisNote({
        variables: {
          data: {
            hmisClientProfileId: clientId,
            ...payload,
          },
        },
        errorPolicy: 'all',
      });

      if (!createResponse) {
        throw new Error('missing createHmisNote response');
      }

      const errorViaExtensions = extractExtensionErrors(createResponse);
      if (errorViaExtensions) {
        applyManualFormErrors(errorViaExtensions, setError);

        return;
      }

      const otherErrors = createResponse.errors?.[0];
      if (otherErrors) {
        throw otherErrors.message;
      }

      const result = createResponse.data?.createHmisNote;

      if (result?.__typename === 'HmisNoteType') {
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
      console.error('createHmisNoteMutation error:', error);
      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = formMethods;

  return (
    <FormProvider {...formMethods}>
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
