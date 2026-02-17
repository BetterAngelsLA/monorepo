import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateNoteDocument,
  DeleteNoteDocument,
  NOTE_FORM_EMPTY_STATE,
  NoteForm,
  NoteFormSchema,
  NotesDocument,
  Ordering,
  SelahTeamEnum,
  TNoteFormInputs,
  UpdateNoteDocument,
  ViewNoteDocument,
  buildNotePayload,
  formDataFromNote,
  useSnackbar,
  useUser,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { DiscardModal, TextButton } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect } from 'react';
import { useForm } from 'react-hook-form';

export default function AddNote() {
  const router = useRouter();
  const { user } = useUser();
  const { showSnackbar } = useSnackbar();
  const { noteId, arrivedFrom, isEditing, clientProfileId, team } =
    useLocalSearchParams<{
      noteId: string;
      arrivedFrom: string;
      isEditing: string;
      clientProfileId: string;
      team: string;
    }>();

  if (!noteId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const isNewNote = noteId === 'new';

  // ── Data fetching ─────────────────────────────────────────────────────
  const { data, loading: isLoading } = useQuery(ViewNoteDocument, {
    variables: { id: noteId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: isNewNote,
  });

  const [updateNote, { error: updateError }] = useMutation(UpdateNoteDocument);
  const [createNote] = useMutation(CreateNoteDocument);
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

  // ── react-hook-form ───────────────────────────────────────────────────
  const methods = useForm<TNoteFormInputs>({
    resolver: zodResolver(NoteFormSchema),
    defaultValues: {
      ...NOTE_FORM_EMPTY_STATE,
      team: (team as SelahTeamEnum) || undefined,
    },
    mode: 'onSubmit',
  });

  const { watch, setValue, getValues, reset, formState } = methods;

  useEffect(() => {
    if (data?.note && !isNewNote) {
      reset(formDataFromNote(data.note));
    }
  }, [data, isNewNote, reset]);

  const form = watch();

  // ── Navigation ────────────────────────────────────────────────────────
  const navigation = useNavigation();

  const resolvedClientProfileId = isNewNote
    ? clientProfileId
    : data?.note?.clientProfile?.id;

  const clientProfileUrl = resolvedClientProfileId
    ? `/client/${resolvedClientProfileId}`
    : '/';

  useLayoutEffect(() => {
    navigation.setOptions({
      purpose: isEditing ? 'Edit Interaction' : 'Add Interaction',
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
          <DiscardModal
            title="Discard interaction?"
            body="All data in this interaction will be lost."
            onDiscard={() => {
              arrivedFrom ? router.replace(arrivedFrom) : router.back();
            }}
            button={
              <TextButton
                regular
                color={Colors.WHITE}
                fontSize="md"
                accessibilityHint="discards interaction and goes back"
                title="Back"
              />
            }
          />
        ),
    });
  }, [navigation, isEditing, arrivedFrom, router]);

  // ── Actions ───────────────────────────────────────────────────────────
  async function deleteNoteFunction() {
    if (isNewNote) {
      arrivedFrom ? router.replace(arrivedFrom) : router.back();
      return;
    }
    try {
      await deleteNote({ variables: { data: { id: noteId || '' } } });
      arrivedFrom ? router.replace(arrivedFrom) : router.back();
    } catch (err) {
      console.error(err);
      showSnackbar({ message: 'Failed to delete interaction.', type: 'error' });
    }
  }

  async function saveNote(isSubmitted?: boolean) {
    // On updates, only send dirty fields so unchanged ones stay UNSET
    const dirty = isNewNote ? undefined : formState.dirtyFields;
    const payload = buildNotePayload(getValues(), isSubmitted, dirty);

    try {
      if (isNewNote) {
        const result = await createNote({
          variables: { data: { clientProfile: clientProfileId, ...payload } },
        });
        if (!result.data?.createNote || !('id' in result.data.createNote)) {
          throw new Error('Failed to create interaction');
        }
      } else {
        const result = await updateNote({
          variables: { data: { id: noteId, ...payload } },
        });
        if (!result.data) {
          throw new Error(`Failed to update interaction: ${updateError}`);
        }
      }

      if (isSubmitted) {
        router.dismissTo(clientProfileUrl);
      } else {
        router.navigate(clientProfileUrl);
      }
    } catch (err) {
      console.error(err);
      showSnackbar({
        message: `Failed to ${isSubmitted ? 'submit' : 'save'} interaction.`,
        type: 'error',
      });
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────
  if (!isNewNote && (!data || isLoading)) return null;
  if (!isNewNote && !data?.note.clientProfile) return null;

  const isSubmitted = isNewNote ? false : !!data?.note.isSubmitted;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <NoteForm
      form={form}
      setValue={setValue}
      noteData={data?.note}
      noteId={noteId}
      isNewNote={isNewNote}
      clientProfileId={resolvedClientProfileId || ''}
      isSubmitted={isSubmitted}
      isEditing={!!isEditing}
      arrivedFrom={arrivedFrom}
      onBack={() => router.back()}
      onDiscard={() =>
        arrivedFrom ? router.replace(arrivedFrom) : router.back()
      }
      onDelete={deleteNoteFunction}
      onSaveDraft={() => saveNote()}
      onSubmit={() => saveNote(true)}
    />
  );
}
