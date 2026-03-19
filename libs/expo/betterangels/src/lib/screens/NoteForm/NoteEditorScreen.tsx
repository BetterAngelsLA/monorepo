import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Colors } from '@monorepo/expo/shared/static';
import { DiscardModal, TextButton } from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  SelahTeamEnum,
  UpdateNoteDocument,
  ViewNoteDocument,
} from '../../apollo';
import { useSnackbar } from '../../hooks';
import { CreateNoteDocument } from '../../ui-components/CreateClientInteraction';
import { InteractionsDocument } from '../../ui-components/InteractionList';
import NoteForm from './NoteForm';
import {
  NOTE_FORM_EMPTY_STATE,
  NoteFormSchema,
  TNoteFormInputs,
} from './schema';
import { buildNotePayload, formDataFromNote } from './transforms';

type NoteEditorScreenProps = {
  mode: 'create' | 'edit';
  noteId?: string;
  arrivedFrom?: string;
  clientProfileId?: string;
  team?: string;
};

export default function NoteEditorScreen(props: NoteEditorScreenProps) {
  const { mode, noteId, arrivedFrom, clientProfileId, team } = props;

  const router = useRouter();
  const navigation = useNavigation();
  const apolloClient = useApolloClient();
  const { showSnackbar } = useSnackbar();

  const isCreateMode = mode === 'create';

  if (!isCreateMode && !noteId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const { data, loading: isLoading } = useQuery(ViewNoteDocument, {
    variables: { id: noteId as string },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: isCreateMode,
  });

  const [updateNote, { error: updateError }] = useMutation(UpdateNoteDocument);
  const [createNote] = useMutation(CreateNoteDocument);

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
    if (data?.note && !isCreateMode) {
      reset(formDataFromNote(data.note));
    }
  }, [data, isCreateMode, reset]);

  const form = watch();

  const resolvedClientProfileId = isCreateMode
    ? clientProfileId
    : data?.note?.clientProfile?.id;

  const clientProfileUrl = resolvedClientProfileId
    ? `/client/${resolvedClientProfileId}`
    : '/';

  const goBack = () => {
    if (isCreateMode) {
      arrivedFrom ? router.replace(arrivedFrom) : router.back();
    } else {
      router.back();
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isCreateMode ? 'Add Interaction' : 'Edit Interaction',
      headerLeft: () => (
        <DiscardModal
          title={isCreateMode ? 'Discard interaction?' : 'Discard changes?'}
          body={
            isCreateMode
              ? 'All data in this interaction will be lost.'
              : 'Any unsaved changes to this interaction will be lost.'
          }
          onDiscard={goBack}
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
      ),
    });
  }, [arrivedFrom, isCreateMode, navigation, router]);

  async function saveNote(isSubmitted?: boolean) {
    const dirty = isCreateMode ? undefined : formState.dirtyFields;
    const payload = buildNotePayload(getValues(), isSubmitted, dirty);

    try {
      if (isCreateMode) {
        const result = await createNote({
          variables: {
            data: {
              clientProfile: clientProfileId,
              ...payload,
            },
          },
        });

        if (!result.data?.createNote || !('id' in result.data.createNote)) {
          throw new Error('Failed to create interaction');
        }

        await apolloClient.refetchQueries({
          include: [InteractionsDocument],
        });
      } else {
        const result = await updateNote({
          variables: { data: { id: noteId as string, ...payload } },
        });

        if (!result.data) {
          throw new Error(`Failed to update interaction: ${updateError}`);
        }
      }

      if (isSubmitted) {
        if (isCreateMode) {
          router.replace(clientProfileUrl);
        } else {
          router.dismissTo(clientProfileUrl);
        }
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

  if (!isCreateMode && (!data || isLoading)) return null;
  if (!isCreateMode && !data?.note.clientProfile) return null;

  const isSubmitted = isCreateMode ? false : !!data?.note.isSubmitted;

  return (
    <NoteForm
      form={form}
      setValue={setValue}
      noteData={data?.note}
      mode={mode}
      clientProfileId={resolvedClientProfileId || ''}
      isSubmitted={isSubmitted}
      onCancel={goBack}
      onSaveDraft={() => saveNote()}
      onSubmit={() => saveNote(true)}
    />
  );
}
