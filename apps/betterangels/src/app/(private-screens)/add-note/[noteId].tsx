import {
  MainScrollContainer,
  useDeleteNoteMutation,
  useUpdateNoteMutation,
  useViewNoteQuery,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  DeleteModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  const router = useRouter();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  if (!noteId) {
    throw new Error('Something went wrong. Please try again.');
  }
  const { data, loading: isLoading } = useViewNoteQuery({
    variables: { id: noteId },
    fetchPolicy: 'cache-and-network',
  });
  const [updateNote] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);
  const methods = useForm<INote>({
    defaultValues: {
      title: '',
      nextStepActions: [{ action: '' }],
      publicDetails: 'G -\nI -\nR -\nP - ',
      noteDate: format(new Date(), 'MM/dd/yyyy'),
      noteTime: format(new Date(), 'HH:mm'),
      privateDetails: '',
    },
  });

  async function deleteNoteFunction() {
    try {
      await deleteNote({
        variables: {
          data: { id: noteId || '' },
        },
      });
      router.back();
    } catch (err) {
      console.error(err);
    }
  }

  const props = {
    expanded,
    setExpanded,
    noteId,
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
        router.back();
      }
    } catch (err) {
      console.log(err);
    }
  }

  if (!data || isLoading) {
    return null;
  }

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1 }}>
        <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} pt="sm">
          <Title
            noteTitle={data.note.title}
            noteDate={data.note.interactedAt}
            {...props}
          />
          <Location
            address={data.note.address}
            point={data.note.point}
            {...props}
          />
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
            <DeleteModal
              body="All data associated with this note will be deleted"
              title="Delete note?"
              onDelete={deleteNoteFunction}
              button={
                <TextButton
                  fontSize="sm"
                  accessibilityHint="deletes creation"
                  title="Cancel"
                />
              }
            />
          }
          optionalAction={
            <TextButton
              mr="sm"
              fontSize="sm"
              onPress={router.back}
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
