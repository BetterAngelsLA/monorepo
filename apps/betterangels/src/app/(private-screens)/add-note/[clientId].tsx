import { MainScrollContainer } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import BottomActions from './BottomActions';
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
  // const [createNote] = useMutation(CREATE_NOTE);
  const [expanded, setExpanded] = useState<undefined | string>();
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);
  const methods = useForm<INote>({
    defaultValues: {
      purposes: [{ value: '' }],
      nextStepActions: [{ value: '' }],
      hmisNote: 'G:\nI:\nR:\nP:',
      noteDateTime: format(new Date(), 'MM-dd-yyy @ HH:mm'),
      moods: [],
      providedServices: [],
      requestedServices: [],
    },
  });

  const publicNote = methods.watch('hmisNote');
  const purposes = methods.watch('purposes');
  const moods = methods.watch('moods');
  const providedServices = methods.watch('providedServices');
  const nextStepActions = methods.watch('nextStepActions');
  const nextStepDate = methods.watch('nextStepDate');
  const requestedServices = methods.watch('requestedServices');

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

  useEffect(() => {
    if (isPublicNoteEdited) {
      return;
    }
    const changedG = purposes.map((purpose) => purpose.value).filter(Boolean);
    const changedP = nextStepActions
      .map((action) => action.value)
      .filter(Boolean);

    const moodIText =
      moods.length > 0 ? 'CM asked how the client was feeling.' : '';

    const moodRText =
      moods.length > 0
        ? 'Client responded that he was ' + moods.join(', ') + '.'
        : '';

    const serviceIText =
      providedServices.length > 0
        ? 'CM provided ' + providedServices.join(', ') + '.'
        : '';

    const serviceRText =
      providedServices.length > 0
        ? 'Client accepted ' + providedServices.join(', ') + '.'
        : '';

    const requestedText =
      requestedServices.length > 0
        ? 'Client requested ' + requestedServices.join(', ') + '.'
        : '';

    const updatedI =
      'I:' +
      (moodIText ? ' ' + moodIText : '') +
      (serviceIText ? ' ' + serviceIText : '');

    const updatedR =
      'R:' +
      (moodRText ? ' ' + moodRText : '') +
      (serviceRText ? ' ' + serviceRText : '') +
      (requestedText ? ' ' + requestedText : '');

    const updatedG = changedG.length ? `G: ${changedG.join(', ')}` : 'G:';
    const updatedP = changedP ? `P: ${changedP.join(', ')}` : 'P:';

    const hasRDate = nextStepDate ? `${updatedP} ${nextStepDate}` : updatedP;

    const newPublicNote = `${updatedG}\n${updatedI}\n${updatedR}\n${hasRDate}`;

    if (newPublicNote !== publicNote) {
      methods.setValue('hmisNote', newPublicNote);
    }
  }, [
    providedServices,
    moods,
    isPublicNoteEdited,
    publicNote,
    methods,
    purposes,
    nextStepActions,
    nextStepDate,
    requestedServices,
  ]);

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
            firstName="Test"
            {...props}
          />
          <PrivateNote {...props} />
        </MainScrollContainer>
        <BottomActions />
      </View>
    </FormProvider>
  );
}
