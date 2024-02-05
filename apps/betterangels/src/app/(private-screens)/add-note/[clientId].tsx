import { MainScrollContainer } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import BottomActions from './BottomActions';
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
  nextStepActions: { action: string; date?: Date; location?: string }[];
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
      nextStepActions: [{ action: '' }],
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
          <Purpose {...props} />
          <Mood {...props} />
          <ProvidedServices {...props} />
          <ServicesRequested {...props} />
          <NextStep {...props} />
          <PublicNote firstName="Test" {...props} />
          <PrivateNote {...props} />
        </MainScrollContainer>
        <BottomActions />
      </View>
    </FormProvider>
  );
}
