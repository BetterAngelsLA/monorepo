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

type TProps = {
  hmisClientId: string;
};

export function HmisProgramNoteCreate(props: TProps) {
  const { hmisClientId } = props;

  const router = useRouter();

  type TFormValues = z.input<typeof HmisProgramNoteFormSchema>;

  const formMethods = useForm<TFormInput>({
    resolver: zodResolver(HmisProgramNoteFormSchema),
    defaultValues: {
      ...hmisProgramNoteFormEmptyState,
      // date: toCalendarDate('2026-10-21', 'yyyy-MM-dd'),
    },
  });

  const onSubmit: SubmitHandler<TFormValues> = async (values) => {
    const payload: TFormOutput = HmisProgramNoteFormtSchemaOutput.parse(values);

    const personalId = hmisClientId;
    console.log();
    console.log('| -----  hmis create ON SUBMIT - values ---------- |');
    console.log('*********  personalId:', personalId);
    console.log(values);
    console.log('');
    console.log('payload');
    console.log(JSON.stringify(payload, null, 2));
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
        <HmisProgramNoteForm />
      </Form.Page>
    </FormProvider>
  );
}
