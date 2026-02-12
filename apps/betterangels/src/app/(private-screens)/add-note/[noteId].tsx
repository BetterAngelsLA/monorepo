import { useMutation, useQuery } from '@apollo/client/react';
import {
  DeleteNoteDocument,
  MainScrollContainer,
  NotesDocument,
  Ordering,
  SelahTeamEnum,
  UpdateNoteDocument,
  ViewNoteDocument,
  useSnackbar,
  useUser,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  DeleteModal,
  DiscardModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import DateAndTime from './DateAndTime';
import Location from './Location';
import ProvidedServices from './ProvidedServices';
import PublicNote from './PublicNote';
import Purpose from './Purpose';
import RequestedServices from './RequestedServices';
import Tasks from './Tasks';
import Team from './Team';

export default function AddNote() {
  const router = useRouter();
  const { user } = useUser();
  const { showSnackbar } = useSnackbar();
  const { noteId, arrivedFrom, isEditing } = useLocalSearchParams<{
    noteId: string;
    arrivedFrom: string;
    isEditing: string;
  }>();

  if (!noteId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery(ViewNoteDocument, {
    variables: { id: noteId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [updateNote, { error: updateError }] = useMutation(UpdateNoteDocument);
  const [deleteNote] = useMutation(DeleteNoteDocument, {
    refetchQueries: [
      {
        query: NotesDocument,
        variables: {
          pagination: { limit: 10 + 1, offset: 0 },
          ordering: [{ interactedAt: Ordering.Desc }, { id: Ordering.Desc }],
          filters: { authors: [user?.id], search: '' },
        },
      },
    ],
  });
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [errors, setErrors] = useState({
    purpose: false,
    location: false,
    date: false,
    time: false,
  });
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  // Local form state - no longer auto-saved
  const [formPurpose, setFormPurpose] = useState<string | null | undefined>(
    undefined
  );
  const [formInteractedAt, setFormInteractedAt] = useState<
    string | null | undefined
  >(undefined);
  const [formTeam, setFormTeam] = useState<SelahTeamEnum | null | undefined>(
    undefined
  );
  const formInitialized = useRef(false);

  // Initialize local form state from server data
  useEffect(() => {
    if (data?.note && !formInitialized.current) {
      formInitialized.current = true;
      setFormPurpose(data.note.purpose);
      setFormInteractedAt(data.note.interactedAt);
      setFormTeam(data.note.team);
    }
  }, [data]);

  useLayoutEffect(() => {
    navigation.setOptions({
      purpose: isEditing ? `Edit Interaction` : 'Add Interaction',
      headerLeft: () =>
        isEditing ? (
          <DiscardModal
            title="Discard changes?"
            body="Any unsaved changes to this interaction will be lost."
            onDiscard={() => router.back()}
            button={
              <TextButton
                regular
                color={Colors.WHITE}
                fontSize="md"
                accessibilityHint="discards changes and goes back"
                title="Back"
              />
            }
          />
        ) : (
          <DeleteModal
            body="All data associated with this interaction will be deleted"
            title="Delete interaction?"
            onDelete={deleteNoteFunction}
            button={
              <TextButton
                regular
                color={Colors.WHITE}
                fontSize="md"
                accessibilityHint="deletes creation"
                title="Back"
              />
            }
          />
        ),
    });
  }, [navigation, isEditing]);

  async function deleteNoteFunction() {
    try {
      await deleteNote({
        variables: {
          data: { id: noteId || '' },
        },
      });
      arrivedFrom ? router.replace(arrivedFrom) : router.back();
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: 'Failed to delete interaction.',
        type: 'error',
      });
    }
  }

  const props = {
    expanded,
    setExpanded,
    noteId,
    scrollRef,
    errors,
    setErrors,
    refetch,
  };
  const getClientProfileUrl = (clientProfileId: string | undefined) =>
    clientProfileId ? `/client/${clientProfileId}` : '/';

  async function submitNote() {
    if (!data?.note.location) {
      setErrors((prev) => {
        return {
          ...prev,
          location: true,
        };
      });

      return;
    }

    if (Object.values(errors).some((error) => error)) {
      return;
    }
    try {
      const result = await updateNote({
        variables: {
          data: {
            id: noteId || '',
            purpose: formPurpose,
            interactedAt: formInteractedAt,
            team: formTeam,
            isSubmitted: true,
          },
        },
      });
      if (!result.data) {
        throw new Error(`Failed to update interaction: ${updateError}`);
      }

      // do not use `router.replace` as it will not reset the routing stack correctly
      // which crashes the app on Android: see Bug Ticket DEV-1839
      return router.dismissTo(
        getClientProfileUrl(data?.note.clientProfile?.id)
      );
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: 'Failed to update interaction.',
        type: 'error',
      });
    }
  }

  async function saveAsDraft() {
    try {
      const result = await updateNote({
        variables: {
          data: {
            id: noteId || '',
            purpose: formPurpose,
            interactedAt: formInteractedAt,
            team: formTeam,
          },
        },
      });
      if (!result.data) {
        throw new Error(`Failed to save draft: ${updateError}`);
      }

      router.navigate(getClientProfileUrl(data?.note.clientProfile?.id));
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: 'Failed to save draft.',
        type: 'error',
      });
    }
  }

  if (!data || isLoading) {
    return null;
  }

  if (!data.note.clientProfile || isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <MainScrollContainer
        ref={scrollRef}
        bg={Colors.NEUTRAL_EXTRA_LIGHT}
        pt="sm"
      >
        <Purpose
          purpose={formPurpose}
          onPurposeChange={setFormPurpose}
          expanded={expanded}
          setExpanded={setExpanded}
          scrollRef={scrollRef}
        />
        <DateAndTime
          interactedAt={formInteractedAt}
          onInteractedAtChange={setFormInteractedAt}
          expanded={expanded}
          setExpanded={setExpanded}
          scrollRef={scrollRef}
        />
        <Team team={formTeam} onTeamChange={setFormTeam} />
        <Location
          address={data.note.location?.address}
          point={data.note.location?.point}
          {...props}
        />
        <ProvidedServices services={data.note.providedServices} {...props} />
        <RequestedServices services={data.note.requestedServices} {...props} />
        <Tasks
          clientProfileId={data.note.clientProfile.id}
          tasks={data.note.tasks}
          team={data.note.team}
          {...props}
        />
        <PublicNote
          note={data.note.publicDetails}
          isPublicNoteEdited={isPublicNoteEdited}
          setIsPublicNoteEdited={setIsPublicNoteEdited}
          {...props}
        />
      </MainScrollContainer>
      <BottomActions
        cancel={
          isEditing ? (
            <DiscardModal
              title="Discard changes?"
              body="Any unsaved changes to this interaction will be lost."
              onDiscard={() => router.back()}
              button={
                <TextButton
                  fontSize="sm"
                  accessibilityHint="discards changes and goes back"
                  title="Cancel"
                />
              }
            />
          ) : (
            <DeleteModal
              body="All data associated with this interaction will be deleted"
              title="Delete interaction?"
              onDelete={deleteNoteFunction}
              button={
                <TextButton
                  fontSize="sm"
                  accessibilityHint="deletes interaction"
                  title="Cancel"
                />
              }
            />
          )
        }
        optionalAction={
          !data.note.isSubmitted && (
            <TextButton
              mr="sm"
              fontSize="sm"
              onPress={saveAsDraft}
              accessibilityHint="saves the interaction as a draft"
              title="Save as Draft"
            />
          )
        }
        onSubmit={submitNote}
      />
    </View>
  );
}
