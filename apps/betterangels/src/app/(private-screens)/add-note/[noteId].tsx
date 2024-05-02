import { useMutation } from '@apollo/client';
import {
  DELETE_NOTE,
  MainScrollContainer,
  useUpdateNoteMutation,
  useViewNoteQuery,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  CancelModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
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

export default function AddNote() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  if (!noteId) {
    throw new Error('Something went wrong. Please try again.');
  }
  const { data, loading: isLoading } = useViewNoteQuery({
    variables: { id: noteId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [udpateNote, { error: updateError }] = useUpdateNoteMutation();

  const [deleteNote] = useMutation(DELETE_NOTE);
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);

  async function deleteNoteFunction() {
    try {
      await deleteNote({
        variables: {
          data: { id: noteId },
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

  async function submitNote() {
    try {
      const result = await udpateNote({
        variables: {
          data: {
            id: noteId,
            isSubmitted: true,
          },
        },
      });
      if (!result.data) {
        console.error(`Failed to update note: ${updateError}`);
        return;
      }
      router.replace('/');
    } catch (err) {
      console.error(err);
    }
  }

  if (!data || isLoading) {
    return null;
  }

  return (
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
        <Purpose purposes={data.note.purposes} {...props} />
        <Mood moods={data.note.moods} {...props} />
        <ProvidedServices
          attachments={data.note.attachments.filter(
            (item) => item.namespace === 'PROVIDED_SERVICES'
          )}
          services={data.note.providedServices}
          {...props}
        />
        <RequestedServices
          attachments={data.note.attachments.filter(
            (item) => item.namespace === 'REQUESTED_SERVICES'
          )}
          services={data.note.requestedServices}
          {...props}
        />
        <NextStep nextSteps={data.note.nextSteps} {...props} />
        <PublicNote
          note={data.note.publicDetails}
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
            onPress={router.back}
            accessibilityHint="saves the note for later"
            title="Save for later"
          />
        }
        onSubmit={submitNote}
      />
    </View>
  );
}
