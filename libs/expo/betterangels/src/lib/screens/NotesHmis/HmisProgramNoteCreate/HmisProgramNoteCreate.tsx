import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { HmisProgramNoteForm } from '../HmisProgramNoteForm';
import {
  HmisProgramNoteFormSchema,
  HmisProgramNoteFormtSchemaOutput,
  TFormInput,
  TFormOutput,
  hmisProgramNoteFormEmptyState,
} from '../HmisProgramNoteForm/formSchema';
import { useHmisCreateClientNoteMutation } from './__generated__/hmisCreateClientNote.generated';

type TProps = {
  hmisClientId: string;
};

export function HmisProgramNoteCreate(props: TProps) {
  const { hmisClientId } = props;

  const router = useRouter();
  const [createHmisClientNoteMutation] = useHmisCreateClientNoteMutation();

  type TFormValues = z.input<typeof HmisProgramNoteFormSchema>;

  const formMethods = useForm<TFormInput>({
    resolver: zodResolver(HmisProgramNoteFormSchema),
    defaultValues: {
      ...hmisProgramNoteFormEmptyState,
      // date: toLocalCalendarDate('2026-10-21', 'yyyy-MM-dd'),
    },
  });

  const onSubmit: SubmitHandler<TFormValues> = async (values) => {
    const payload: TFormOutput = HmisProgramNoteFormtSchemaOutput.parse(values);

    const { data } = await createHmisClientNoteMutation({
      variables: {
        clientNoteInput: {
          personalId: hmisClientId,
          ...payload,
        },
      },

      errorPolicy: 'all',
    });

    console.log();
    console.log('| -------------  ON SUBMIT RESULT  ------------- |');
    console.log('data');
    console.log(JSON.stringify(data, null, 2));
    console.log();
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
