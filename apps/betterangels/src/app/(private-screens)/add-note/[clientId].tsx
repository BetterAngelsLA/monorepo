import { MainScrollContainer } from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Button, TextButton } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import Location from './Location';
import Mood from './Mood';
import NextStep from './NextStep';
import PrivateNote from './PrivateNote';
import ProvidedServices from './ProvidedServices';
import PublicNote from './PublicNote';
import Purpose from './Purpose';
import ServicesRequested from './ServicesRequested';
import Title from './Title';

interface INote {
  purposes: { value: string }[];
  nextStepActions: { value: string }[];
  hmisNote: string;
  noteDateTime: string;
}

export default function AddNote() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  // const [createNote] = useMutation(CREATE_NOTE);
  const [expanded, setExpanded] = useState<undefined | string>();
  const methods = useForm<INote>({
    defaultValues: {
      purposes: [{ value: '' }],
      nextStepActions: [{ value: '' }],
      hmisNote: 'G: \n\nI: \n\nR: \n\nP: \n',
      noteDateTime: format(new Date(), 'MM-dd-yyy @ HH:mm'),
    },
  });

  const props = {
    expanded,
    setExpanded,
  };

  console.log(clientId);

  // async function onSubmit(data: any) {
  //   try {
  //     const { data } = await createNote({
  //       variables: {
  //         input: {
  //           title: 'note title',
  //           body: 'note body',
  //         },
  //       },
  //     });

  //     console.log('Note created:', data.createNote);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1 }}>
        <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} pt="sm">
          <Title firstName="Test" {...props} />
          <Location {...props} />
          <Purpose {...props} />
          <Mood {...props} />
          <ProvidedServices {...props} />
          <ServicesRequested {...props} />
          <NextStep {...props} />
          <PublicNote firstName="Test" {...props} />
          <PrivateNote {...props} />
        </MainScrollContainer>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: Spacings.md,
            paddingHorizontal: Spacings.sm,
            backgroundColor: Colors.WHITE,
            borderTopWidth: 1,
            borderTopColor: Colors.NEUTRAL,
          }}
        >
          <TextButton
            fontSize="sm"
            onPress={() => console.log('cancel')}
            accessibilityHint="cancels note creation"
            title="Cancel"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextButton
              mr="sm"
              fontSize="sm"
              onPress={() => console.log('save for later')}
              accessibilityHint="saves the note for later"
              title="Save for later"
            />
            <Button
              fontSize="sm"
              size="full"
              height="md"
              variant="primary"
              accessibilityHint="submit the note"
              title="Submit"
              style={{ maxWidth: 85 }}
              onPress={methods.handleSubmit((data) =>
                console.log('DATA: ', data)
              )}
            />
          </View>
        </View>
      </View>
    </FormProvider>
  );
}
