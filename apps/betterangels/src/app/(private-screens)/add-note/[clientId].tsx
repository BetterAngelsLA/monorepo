import { MainScrollContainer } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { Button } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import Purpose from './Purpose';

interface INote {
  purposes: { value: string }[];
}

export default function AddNote() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const [expanded, setExpanded] = useState<undefined | string>();
  const methods = useForm<INote>({
    defaultValues: {
      purposes: [{ value: '' }],
    },
  });
  useFormContext();

  console.log(clientId);

  return (
    <FormProvider {...methods}>
      <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} pt="sm">
        <Purpose expanded={expanded} setExpanded={setExpanded} />

        <Button
          size="full"
          variant="primary"
          accessibilityHint="submit the note"
          title="Submit"
          onPress={methods.handleSubmit((data) => console.log('DATA: ', data))}
        />
      </MainScrollContainer>
    </FormProvider>
  );
}
