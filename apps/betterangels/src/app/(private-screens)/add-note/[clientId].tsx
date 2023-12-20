import { useMutation } from '@apollo/client';
import { CREATE_NOTE, MainScrollContainer } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { Button } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import Purpose from './Purpose';

interface INote {
  purposes: { value: string }[];
}

export default function AddNote() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const [createNote] = useMutation(CREATE_NOTE);
  const [expanded, setExpanded] = useState<undefined | string>();
  const methods = useForm<INote>({
    defaultValues: {
      purposes: [{ value: '' }],
    },
  });

  console.log(clientId);

  async function onSubmit(data: any) {
    try {
      const { data } = await createNote({
        variables: {
          input: {
            title: 'note title',
            body: 'note body',
          },
        },
      });

      console.log('Note created:', data.createNote);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <FormProvider {...methods}>
      <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} pt="sm">
        <Purpose expanded={expanded} setExpanded={setExpanded} />

        <Button
          size="full"
          variant="primary"
          accessibilityHint="submit the note"
          title="Submit"
          onPress={methods.handleSubmit(onSubmit)}
        />
      </MainScrollContainer>
    </FormProvider>
  );
}
