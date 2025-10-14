import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { HmisProgramNoteForm } from '../HmisProgramNoteForm';
import {
  HmisProgramNoteFormSchema,
  hmisProgramNoteFormEmptyState,
} from '../HmisProgramNoteForm/formSchema';

type TProps = {
  hmisClientId: string;
};

export function HmisProgramNoteCreate(props: TProps) {
  const { hmisClientId } = props;

  const router = useRouter();

  type TFormValues = z.input<typeof HmisProgramNoteFormSchema>;

  const formMethods = useForm<TFormValues>({
    resolver: zodResolver(HmisProgramNoteFormSchema),
    defaultValues: hmisProgramNoteFormEmptyState,
  });

  useEffect(() => {
    formMethods.reset({
      ...hmisProgramNoteFormEmptyState,
      personalId: hmisClientId,
    });
  }, [hmisClientId]);

  const onSubmit: SubmitHandler<TFormValues> = async (values) => {
    console.log();
    console.log('| -----  hmis create ON SUBMIT - values ---------- |');
    console.log(values);
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
