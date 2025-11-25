import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { extractHMISErrors } from '../../../apollo';
import { applyOperationFieldErrors } from '../../../errors';
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
  hmisProgramNoteFormEmptyState,
} from '../HmisProgramNoteForm/formSchema';
import { HmisCreateClientNoteDocument } from './__generated__/hmisCreateClientNote.generated';

type TProps = {
  hmisClientId: string;
  arrivedFrom?: string;
};

export function HmisProgramNoteCreate(props: TProps) {
  const { hmisClientId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisClientNoteMutation] = useMutation(
    HmisCreateClientNoteDocument
  );

  const formKeys = Object.keys(hmisProgramNoteFormEmptyState);

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

      const { data } = await createHmisClientNoteMutation({
        variables: {
          clientNoteInput: {
            personalId: hmisClientId,
            ...payload,
          },
        },
        errorPolicy: 'all',
      });

      const result = data?.hmisCreateClientNote;

      if (!result) {
        throw new Error('missing hmisCreateClientNote response');
      }

      if (result?.__typename === 'HmisCreateClientNoteError') {
        const { message: hmisErrorMessage } = result;
        const { status, fieldErrors = [] } =
          extractHMISErrors(hmisErrorMessage) || {};

        // handle unprocessable_entity errors and exit
        if (status === 422) {
          const formFieldErrors = fieldErrors.filter(({ field }) =>
            formKeys.includes(field)
          );
          applyOperationFieldErrors(formFieldErrors, setError);
          return;
        }

        if (status === 404) {
          throw new Error('could not find Client of Program Enrollment');
        }
        // HmisCreateClientError exists but not 422 | 404
        // throw generic error
        throw new Error(hmisErrorMessage);
      }

      if (result?.__typename !== 'HmisClientNoteType') {
        throw new Error('invalid HmisClientNoteType response');
      }

      router.dismissTo(
        `/client/${hmisClientId}?activeTab=${ClientViewTabEnum.Interactions}`
      );
    } catch (error) {
      console.error('createHmisClientNoteMutation error:', error);
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
        <HmisProgramNoteForm hmisClientId={hmisClientId} />
      </Form.Page>
    </FormProvider>
  );
}
