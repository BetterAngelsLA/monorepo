import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
  DELETE_NOTE,
  GET_NOTE,
  GET_NOTES,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
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

const initialValues = {
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
};

export default function AddNote() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const client = useApolloClient();
  const { data, loading: isLoading } = useQuery(GET_NOTE, {
    variables: { id: noteId },
    fetchPolicy: 'cache-and-network',
  });
  const [updateNote] = useMutation(UPDATE_NOTE);
  const [deleteNote] = useMutation(DELETE_NOTE);
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState<boolean | null>(
    null
  );
  const methods = useForm<INote>({
    defaultValues: initialValues,
  });

  async function deleteNoteFunction() {
    try {
      await deleteNote({
        variables: {
          data: { id: noteId },
        },
      });
      client.refetchQueries({
        include: [GET_NOTES],
      });
      router.back();
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    if (data && !isLoading) {
      let publicDetails = initialValues.publicDetails;

      if (data.note.publicDetails) {
        setIsPublicNoteEdited(true);
        publicDetails = data.note.publicDetails;
      } else {
        setIsPublicNoteEdited(false);
      }

      const title = data.note.title ? data.note.title : 'Session with ';

      methods.reset({
        ...initialValues,
        publicDetails,
        title,
      });
    }
  }, [data, isLoading]);

  const watchedValues = methods.watch([
    'purposes',
    'moods',
    'providedServices',
    'nextStepActions',
    'requestedServices',
    'publicDetails',
    'title',
  ]);

  const props = {
    expanded,
    setExpanded,
  };

  async function updateNoteFunction(values: INote, isSubmitted: boolean) {
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
        client.refetchQueries({
          include: [GET_NOTES],
        });
        router.back();
      }
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    if (isPublicNoteEdited || isPublicNoteEdited === null) {
      return;
    }

    const [
      purposes,
      moods,
      providedServices,
      nextStepActions,
      requestedServices,
      publicDetails,
    ] = watchedValues;

    const generateOjbect = {
      purposes,
      moods,
      providedServices,
      nextStepActions,
      requestedServices,
    };

    const newPublicNote = generatedPublicNote(generateOjbect);

    if (newPublicNote !== publicDetails) {
      methods.setValue('publicDetails', newPublicNote);
    }
  }, [isPublicNoteEdited, methods, watchedValues]);

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1 }}>
        <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} pt="sm">
          <Title noteTitle={watchedValues[6]} {...props} />
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
        <BottomActions
          cancel={
            <CancelModal
              body="All data associated with this note will be deleted"
              title="Delete note?"
              onDelete={deleteNoteFunction}
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
