import {
  MainScrollContainer,
  generatedPublicNote,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  CancelModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import Mood from './Mood';
import NextStep from './NextStep';
import PrivateNote from './PrivateNote';
import ProvidedServices from './ProvidedServices';
import PublicNote from './PublicNote';
import Purpose from './Purpose';
import RequestedServices from './RequestedServices';
import Title from './Title';

interface INote {
  purposes: { value: string }[];
  nextStepActions: { value: string }[];
  hmisNote: string;
  noteDateTime: string;
  moods: string[];
  providedServices: string[];
  nextStepDate: Date;
  requestedServices: string[];
}

export default function AddNote() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  // const [createNote] = useMutation(CREATE_NOTE);
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);
  const methods = useForm<INote>({
    defaultValues: {
      purposes: [{ value: '' }],
      nextStepActions: [{ value: '' }],
      hmisNote: 'G -\nI -\nR -\nP - ',
      noteDateTime: format(new Date(), 'MM/dd/yyy @ HH:mm'),
      moods: [],
      providedServices: [],
      requestedServices: [],
    },
  });

  const watchedValues = methods.watch([
    'purposes',
    'moods',
    'providedServices',
    'nextStepActions',
    'nextStepDate',
    'requestedServices',
    'hmisNote',
  ]);
  const publicNote = methods.watch('hmisNote');

  const props = {
    expanded,
    setExpanded,
  };

  async function onSubmit(data: any) {
    router.navigate({
      pathname: '/phq-9',
      params: {
        clientId,
        hmisId: '12345678',
      },
    });
    // try {
    //   const { data } = await createNote({
    //     variables: {
    //       input: {
    //         title: 'note title',
    //         body: 'note body',
    //       },
    //     },
    //   });
    //   console.log('Note created:', data.createNote);
    // } catch (e) {
    //   console.log(e);
    // }
  }

  useEffect(() => {
    if (isPublicNoteEdited) {
      return;
    }
    const [
      purposes,
      moods,
      providedServices,
      nextStepActions,
      nextStepDate,
      requestedServices,
    ] = watchedValues;

    const generateOjbect = {
      purposes,
      moods,
      providedServices,
      nextStepActions,
      nextStepDate,
      requestedServices,
    };

    const newPublicNote = generatedPublicNote(generateOjbect);
    if (newPublicNote !== publicNote) {
      methods.setValue('hmisNote', newPublicNote);
    }
  }, [isPublicNoteEdited, methods, publicNote, watchedValues]);

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1 }}>
        <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} pt="sm">
          <Title firstName="Test" {...props} />
          <Purpose {...props} />
          <Mood {...props} />
          <ProvidedServices {...props} />
          <RequestedServices {...props} />
          <NextStep {...props} />
          <PublicNote
            isPublicNoteEdited={isPublicNoteEdited}
            setIsPublicNoteEdited={setIsPublicNoteEdited}
            {...props}
          />
          <PrivateNote {...props} />
        </MainScrollContainer>
        <BottomActions
          cancel={
            <CancelModal
              body="All data associated with this note will be deleted"
              title="Delete note?"
            />
          }
          optionalAction={
            <TextButton
              mr="sm"
              fontSize="sm"
              onPress={() => console.log('save for later')}
              accessibilityHint="saves the note for later"
              title="Save for later"
            />
          }
          onSubmit={methods.handleSubmit(onSubmit)}
        />
      </View>
    </FormProvider>
  );
}
