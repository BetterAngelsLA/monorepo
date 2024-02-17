import { useMutation, useQuery } from '@apollo/client';
import {
  MainScrollContainer,
  UPDATE_NOTE,
  VIEW_NOTE,
  generatedPublicNote,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function UpdateNote() {
  const [note, setNote] = useState<INote | undefined>();
  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery(VIEW_NOTE, {
    fetchPolicy: 'network-only',
  });
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const [updateNote] = useMutation(UPDATE_NOTE);
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);
  const methods = useForm<INote>({
    defaultValues: {
      id: noteId,
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
  // const { getValues } = useFormContext();
  // const formValues = getValues();

  const refetchNote = useCallback(async () => {
    try {
      const response = await refetch();
      if (response.data) {
        setNote(response.data.note);
      }
    } catch (error) {
      console.error('Error refetching note data:', error);
    }
  }, [refetch]);

  useEffect(() => {
    if (data && !isLoading) {
      setNote(data.note);
      console.log(data.note);
    }
  }, [data, isLoading]);

  const value = useMemo(
    () => ({
      note,
      setNote,
      isLoading,
      refetchNote,
    }),
    [note, isLoading, refetchNote, setNote]
  );

  //   query ViewNote($id: ID!) {
  //     note(pk: $id) {
  //         id
  //         title
  //         publicDetails
  //         moods {
  //             descriptor
  //         }
  //     }
  // }

  const watchedValues = methods.watch([
    'id',
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

  async function updateNoteFunction() {
    // console.log(formValues);

    try {
      const { data } = await updateNote({
        variables: {
          data: {
            id: noteId,
            title: 'updated title',
            publicDetails: 'updated public note',
          },
        },
      });
      // console.log('formValues.id: ', formValues.id);
      // console.log('formValues.title: ', formValues.title);
      console.log(note?.id);
      console.log(note?.title);
      console.log(note?.publicDetails);
      console.log('UPDATE NOTE DATA:', data);
      // router.navigate({
      //   pathname: `/add-note/${data?.createNote?.client.id}`,
      // });
      // console.log('Note updated:', data?.createNote);
    } catch (e) {
      // console.log(e);
    }
  }

  // console.log(clientId);

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
    const [
      id,
      title,
      purposes,
      moods,
      providedServices,
      nextStepActions,
      nextStepDate,
      requestedServices,
    ] = watchedValues;

    const generateOjbect = {
      id,
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
