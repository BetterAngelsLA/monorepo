import { useMutation, useQuery } from '@apollo/client';
import {
  GET_NOTE,
  MainScrollContainer,
  UPDATE_NOTE,
  generatedPublicNote,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  privateDetails: string;
}

export default function UpdateNote() {
  const router = useRouter();
  const [note, setNote] = useState<INote | undefined>();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const { data, loading: isLoading } = useQuery(GET_NOTE, {
    variables: { id: noteId },
    fetchPolicy: 'network-only',
  });
  const [updateNote] = useMutation(UPDATE_NOTE);
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);
  const methods = useForm<INote>({
    defaultValues: {
      title: '',
      purposes: [{ value: 'Purpose' }],
      nextStepActions: [{ value: '' }],
      publicDetails: 'G -\nI -\nR -\nP - ',
      noteDateTime: format(new Date(), 'MM/dd/yyy @ HH:mm'),
      moods: [],
      providedServices: [],
      requestedServices: [],
      privateDetails: '',
    },
  });

  useEffect(() => {
    if (data && !isLoading) {
      setNote(data.note);
    }
  }, [data, isLoading]);

  const watchedValues = methods.watch([
    'title',
    'purposes',
    'moods',
    'providedServices',
    'nextStepActions',
    'nextStepDate',
    'requestedServices',
    'publicDetails',
    'privateDetails',
  ]);
  const publicDetails = methods.watch('publicDetails');

  const props = {
    expanded,
    setExpanded,
  };

  async function updateNoteFunction(values, is_submitted: boolean) {
    console.log(values);
    try {
      if (is_submitted === true) {
        await updateNote({
          variables: {
            data: {
              id: noteId,
              title: values.title,
              publicDetails: values.publicDetails,
              privateDetails: values.privateDetails,
              isSubmitted: true,
            },
          },
        });
        router.navigate(`/`);
      } else {
        await updateNote({
          variables: {
            data: {
              id: noteId,
              title: values.title,
              publicDetails: values.publicDetails,
              privateDetails: values.privateDetails,
            },
          },
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

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
    if (newPublicNote !== publicDetails) {
      methods.setValue('publicDetails', newPublicNote);
    }
  }, [isPublicNoteEdited, methods, publicDetails, watchedValues]);

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1 }}>
        <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} pt="sm">
          <Title noteTitle={note?.title} {...props} />
          <Purpose
            // notePurposes={note?.purposes}
            {...props}
          />
          <Mood {...props} />
          <ProvidedServices
            // noteProvidedServices={note?.providedServices}
            {...props}
          />
          <RequestedServices
            // noteRequestedServices={note?.requestedServices}
            {...props}
          />
          <NextStep {...props} />
          <PublicNote
            notePublicDetails={note?.publicDetails}
            isPublicNoteEdited={isPublicNoteEdited}
            setIsPublicNoteEdited={setIsPublicNoteEdited}
            {...props}
          />
          <PrivateNote notePrivateDetails={note?.privateDetails} {...props} />
        </MainScrollContainer>
        <BottomActions updateNoteFunction={updateNoteFunction} />
      </View>
    </FormProvider>
  );
}
