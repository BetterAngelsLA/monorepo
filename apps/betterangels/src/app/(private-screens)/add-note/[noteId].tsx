import { useMutation, useQuery } from '@apollo/client';
import {
  GET_NOTE,
  MainScrollContainer,
  UPDATE_NOTE,
  generatedPublicNote,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  CancelModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';
import Location from './Location';
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
  nextStepActions: {
    action: string;
    date?: Date | undefined;
    location?: string;
    time?: Date | undefined;
  }[];
  publicDetails: string;
  noteDate: string;
  noteTime: string;
  moods: string[];
  providedServices: string[];
  requestedServices: string[];
  privateDetails: string;
}

export default function AddNote() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
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
      purposes: [{ value: '' }],
      nextStepActions: [{ action: '' }],
      publicDetails: 'G -\nI -\nR -\nP - ',
      noteDate: format(new Date(), 'MM/dd/yyyy'),
      noteTime: format(new Date(), 'HH:mm'),
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
    'purposes',
    'moods',
    'providedServices',
    'nextStepActions',
    'requestedServices',
    'publicDetails',
  ]);
  const publicNote = methods.watch('publicDetails');

  const props = {
    expanded,
    setExpanded,
  };

  async function updateNoteFunction(values: INote, isSubmitted: boolean) {
    console.log(values);
    try {
      await updateNote({
        variables: {
          data: {
            id: noteId,
            title: values.title,
            publicDetails: values.publicDetails,
            privateDetails: values.privateDetails,
            isSubmitted: isSubmitted,
          },
        },
      });
      if (isSubmitted === true) {
        router.navigate(`/`);
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
      purposes,
      moods,
      providedServices,
      nextStepActions,
      requestedServices,
    ] = watchedValues;

    const generateOjbect = {
      purposes,
      moods,
      providedServices,
      nextStepActions,
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
          <Title noteTitle={note?.title} {...props} />
          <Location {...props} />
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
        {/* TODO: remove in future, only for testing */}
        <View>
          <Link
            style={{ padding: 10 }}
            href={{
              pathname: '/form',
              params: { clientId, hmisId: '12345678', mood: 'suicidal' },
            }}
          >
            suicidal
          </Link>
          <Link
            style={{ padding: 10 }}
            href={{
              pathname: '/form',
              params: { clientId, mood: 'anxious', hmisId: '12345678' },
            }}
          >
            anxious
          </Link>
          <Link
            style={{ padding: 10 }}
            href={{
              pathname: '/form',
              params: { clientId, mood: 'depressed', hmisId: '12345678' },
            }}
          >
            depressed
          </Link>
        </View>
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
              // NOTE: Not sure how to access form values here, without handleSubmit & useFormContext
              onPress={() => console.log('save for later')}
              accessibilityHint="saves the note for later"
              title="Save for later"
            />
          }
          onSubmit={methods.handleSubmit((values) =>
            updateNoteFunction(values, true)
          )}
        />
      </View>
    </FormProvider>
  );
}
