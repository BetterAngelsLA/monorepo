import { useMutation, useQuery } from '@apollo/client';
import {
  GET_NOTE,
  MainScrollContainer,
  UPDATE_NOTE,
  generatedPublicNote,
} from '@monorepo/expo/betterangels';
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
  id: string;
  title: string;
  purposes: { value: string }[];
  nextStepActions: { value: string }[];
  publicDetails: string;
  noteDateTime: string;
  moods: string[];
  providedServices: string[];
  nextStepDate: Date;
  requestedServices: string[];
}

export default function AddNote() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const { data, loading: isLoading } = useQuery(GET_NOTE, {
    variables: { id: noteId },
    fetchPolicy: 'network-only',
  });
  const [note, setNote] = useState<INote | undefined>();
  const [updateNote] = useMutation(UPDATE_NOTE);
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);
  const methods = useForm<INote>({
    defaultValues: {
      title: '',
      purposes: [{ value: '' }],
      nextStepActions: [{ value: '' }],
      publicDetails: 'G -\nI -\nR -\nP - ',
      noteDateTime: format(new Date(), 'MM/dd/yyy @ HH:mm'),
      moods: [],
      providedServices: [],
      requestedServices: [],
    },
  });

  const watchedValues = methods.watch([
    'title',
    'purposes',
    'moods',
    'providedServices',
    'nextStepActions',
    'nextStepDate',
    'requestedServices',
    'publicDetails',
  ]);
  const publicNote = methods.watch('publicDetails');

  const props = {
    expanded,
    setExpanded,
  };

  // console.log(clientId);

  // async function viewNoteFunction(noteId: string) {
  //   try {
  //     const { data } = await viewNote({
  //       variables: {
  //         data: {
  //           id: noteId,
  //         },
  //       },
  //     });

  //     // router.navigate({
  //     //   pathname: `/add-note/${data?.createNote?.client.id}`,
  //     // });
  //     // console.log('!!!!!!!!noteId!!!!!!!!!!!', noteId);
  //     console.log('GOING TO UPDATE NOTE', noteId);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

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

  // useEffect(() => {
  //   console.log('!!!!!!!!noteId!!!!!!!!!!!', noteId);
  // }, [noteId]);

  useEffect(() => {
    if (data && !isLoading) {
      setNote(data.note);
      console.log(data.note);
    }
  }, [data, isLoading]);
  useEffect(() => {
    if (isPublicNoteEdited) {
      return;
    }
    const [
      title,
      purposes,
      moods,
      providedServices,
      nextStepActions,
      nextStepDate,
      requestedServices,
    ] = watchedValues;

    const generateOjbect = {
      title,
      purposes,
      moods,
      providedServices,
      nextStepActions,
      nextStepDate,
      requestedServices,
    };

    const newPublicNote = generatedPublicNote(generateOjbect);
    if (newPublicNote !== publicNote) {
      methods.setValue('publicDetails', newPublicNote);
    }
  }, [isPublicNoteEdited, methods, publicNote, watchedValues]);

  async function updateNoteFunction() {
    try {
      const { data } = await updateNote({
        variables: {
          data: {
            id: 30,
            title: 'updated title',
            publicDetails: 'updated public note',
          },
        },
      });
      console.log('UPDATE NOTE DATA:', data);
    } catch (e) {
      console.log(e);
    }
  }

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
        <BottomActions updateNoteFunction={updateNoteFunction} />
      </View>
    </FormProvider>
  );
}
