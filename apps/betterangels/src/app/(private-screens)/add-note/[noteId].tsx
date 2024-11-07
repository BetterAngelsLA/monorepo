import {
  MainScrollContainer,
  NotesDocument,
  Ordering,
  useDeleteNoteMutation,
  useRevertNoteMutation,
  useSnackbar,
  useUpdateNoteMutation,
  useUser,
  useViewNoteQuery,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  Button,
  DeleteModal,
  RevertModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import DateAndTime from './DateAndTime';
import Location from './Location';
import ProvidedServices from './ProvidedServices';
import PublicNote from './PublicNote';
import Purpose from './Purpose';
import RequestedServices from './RequestedServices';
import SubmittedModal from './SubmittedModal';
import Team from './Team';

const renderModal = (
  isRevert: string | undefined,
  onRevert: () => void,
  onDelete: () => void,
  buttonTitle: string
) => {
  if (isRevert) {
    return (
      <RevertModal
        body="All changes you made since the last save will be discarded"
        title="Discard changes?"
        onRevert={onRevert}
        button={
          <TextButton
            fontSize="sm"
            accessibilityHint="discards changes and reverts interaction to previous state"
            title={buttonTitle}
          />
        }
      />
    );
  } else {
    return (
      <DeleteModal
        body="All data associated with this interaction will be deleted"
        title="Delete interaction?"
        onDelete={onDelete}
        button={
          <TextButton
            fontSize="sm"
            accessibilityHint="deletes interaction"
            title={buttonTitle}
          />
        }
      />
    );
  }
};

export default function AddNote() {
  const router = useRouter();
  const { user } = useUser();
  const { showSnackbar } = useSnackbar();
  const { noteId, revertBeforeTimestamp, arrivedFrom } = useLocalSearchParams<{
    noteId: string;
    revertBeforeTimestamp: string;
    arrivedFrom: string;
  }>();

  if (!noteId) {
    throw new Error('Something went wrong. Please try again.');
  }
  const {
    data,
    loading: isLoading,
    refetch,
  } = useViewNoteQuery({
    variables: { id: noteId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [updateNote, { error: updateError }] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation({
    refetchQueries: [
      {
        query: NotesDocument,
        variables: {
          pagination: { limit: 10 + 1, offset: 0 },
          order: { interactedAt: Ordering.Desc, id: Ordering.Desc },
          filters: { createdBy: user?.id, search: '' },
        },
      },
    ],
  });
  const [revertNote] = useRevertNoteMutation();
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [errors, setErrors] = useState({
    purpose: false,
    location: false,
    date: false,
    time: false,
  });
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);
  const [isSubmitted, setSubmitted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      purpose: revertBeforeTimestamp ? `Edit Interaction` : 'Add Interaction',
      headerLeft: () =>
        revertBeforeTimestamp ? (
          <RevertModal
            body="All changes you made since the last save will be discarded"
            title="Discard changes?"
            onRevert={revertNoteFunction}
            button={
              <TextButton
                regular
                color={Colors.WHITE}
                fontSize="md"
                accessibilityHint="discards changes and reverts interaction to previous state"
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
  }, [navigation, revertBeforeTimestamp]);

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

  async function revertNoteFunction() {
    try {
      await revertNote({
        variables: {
          data: {
            id: noteId || '',
            revertBeforeTimestamp: revertBeforeTimestamp || '',
          },
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
    scrollRef,
    errors,
    setErrors,
    refetch,
  };
  const getClientProfileUrl = (clientProfileId: string | undefined) =>
    clientProfileId ? `/client/${clientProfileId}` : '/';

  async function submitNote() {
    if (Object.values(errors).some((error) => error)) {
      return;
    }
    try {
      const result = await updateNote({
        variables: {
          data: {
            id: noteId || '',
            isSubmitted: true,
          },
        },
      });
      if (!result.data) {
        throw new Error(`Failed to update interaction: ${updateError}`);
      }

      return router.replace(
        getClientProfileUrl(data?.note.client?.clientProfile?.id)
      );
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: 'Failed to update interaction.',
        type: 'error',
      });
    }
  }

  // TODO: Will be back with moods
  // const MoodAttachments = useMemo(
  //   () => filterAttachments(NoteNamespaceEnum.MoodAssessment),
  //   [data]
  // );

  if (!data || isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <MainScrollContainer
        ref={scrollRef}
        bg={Colors.NEUTRAL_EXTRA_LIGHT}
        pt="sm"
      >
        <Purpose purpose={data.note.purpose} {...props} />
        <DateAndTime interactedAt={data.note.interactedAt} {...props} />
        <Team team={data.note.team} {...props} />
        <Location
          address={data.note.location?.address}
          point={data.note.location?.point}
          {...props}
        />

        {/* TODO: Will be back later */}
        {/* <Mood
          attachments={MoodAttachments}
          moods={data.note.moods}
          {...props}
        /> */}
        <ProvidedServices services={data.note.providedServices} {...props} />
        <RequestedServices services={data.note.requestedServices} {...props} />
        <PublicNote
          note={data.note.publicDetails}
          isPublicNoteEdited={isPublicNoteEdited}
          setIsPublicNoteEdited={setIsPublicNoteEdited}
          {...props}
        />
        {revertBeforeTimestamp && (
          <DeleteModal
            body="All data associated with this interaction will be deleted"
            title="Delete interaction?"
            onDelete={deleteNoteFunction}
            button={
              <Button
                accessibilityHint="deletes interaction"
                title="Delete Interaction"
                variant="negative"
                size="full"
                mt="xs"
              />
            }
          />
        )}
      </MainScrollContainer>
      <BottomActions
        cancel={renderModal(
          revertBeforeTimestamp,
          revertNoteFunction,
          deleteNoteFunction,
          'Cancel'
        )}
        optionalAction={
          !data.note.isSubmitted && (
            <TextButton
              mr="sm"
              fontSize="sm"
              onPress={() =>
                router.navigate(
                  getClientProfileUrl(data?.note.client?.clientProfile?.id)
                )
              }
              accessibilityHint="saves the interaction for later"
              title="Save for later"
            />
          )
        }
        onSubmit={submitNote}
      />

      <SubmittedModal
        firstName={data.note.client?.firstName}
        closeModal={() => {
          setSubmitted(false);
          router.navigate(
            getClientProfileUrl(data?.note.client?.clientProfile?.id)
          );
        }}
        isModalVisible={isSubmitted}
      />
    </View>
  );
}
