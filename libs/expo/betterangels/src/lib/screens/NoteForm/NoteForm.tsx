import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  DiscardModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useRef, useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { ServiceRequestTypeEnum, ViewNoteQuery } from '../../apollo';
import {
  MainScrollContainer,
  NoteTasks,
  RequestedProvidedServices,
} from '../../ui-components';
import DateAndTime from './DateAndTime';
import type { TNoteFormInputs } from './formSchema';
import Location from './Location';
import PublicNote from './PublicNote';
import Purpose from './Purpose';
import Team from './Team';

// ── Props ───────────────────────────────────────────────────────────────

export interface NoteFormProps {
  /** Current form field values (from react-hook-form watch()). */
  form: TNoteFormInputs;
  /** react-hook-form setValue */
  setValue: UseFormSetValue<TNoteFormInputs>;
  /** Server query data (for location fallback + public note generation). */
  noteData?: ViewNoteQuery['note'] | null;
  /** The note ID (or "new"). */
  noteId: string;
  /** Whether this is a brand-new note. */
  isNewNote: boolean;
  /** Resolved client profile ID. */
  clientProfileId: string;
  /** Whether note is already submitted. */
  isSubmitted: boolean;
  /** Whether we're in "edit" mode (vs "add"). */
  isEditing: boolean;
  /** Where the user came from (for cancel navigation). */
  arrivedFrom?: string;
  /** Called when user navigates back. */
  onBack: () => void;
  /** Called when user discards (cancel for non-editing). */
  onDiscard: () => void;
  /** Called to delete (cancel press in add mode for existing draft). */
  onDelete: () => void;
  /** Called to save as draft. */
  onSaveDraft: () => void;
  /** Called to submit. */
  onSubmit: () => void;
}

export default function NoteForm(props: NoteFormProps) {
  const {
    form,
    setValue,
    noteData,
    noteId,
    isNewNote,
    clientProfileId,
    isSubmitted,
    isEditing,
    onBack,
    onDiscard,
    onDelete,
    onSaveDraft,
    onSubmit,
  } = props;

  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [errors, setErrors] = useState({
    purpose: false,
    location: false,
    date: false,
    time: false,
  });
  const [isPublicNoteEdited, setIsPublicNoteEdited] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSubmit = () => {
    if (!form.location) {
      setErrors((prev) => ({ ...prev, location: true }));
      return;
    }
    if (Object.values(errors).some(Boolean)) {
      return;
    }
    onSubmit();
  };

  return (
    <View style={{ flex: 1 }}>
      <MainScrollContainer
        ref={scrollRef}
        bg={Colors.NEUTRAL_EXTRA_LIGHT}
        pt="sm"
      >
        <Purpose
          purpose={form.purpose}
          onPurposeChange={(v) => setValue('purpose', v, { shouldDirty: true })}
          expanded={expanded}
          setExpanded={setExpanded}
          scrollRef={scrollRef}
        />
        <DateAndTime
          interactedAt={form.interactedAt}
          onInteractedAtChange={(v) =>
            setValue('interactedAt', v, { shouldDirty: true })
          }
          expanded={expanded}
          setExpanded={setExpanded}
          scrollRef={scrollRef}
        />
        <Team
          team={form.team}
          onTeamChange={(v) => setValue('team', v, { shouldDirty: true })}
        />
        <Location
          noteId={noteId}
          point={
            form.location?.point
              ? form.location.point
              : noteData?.location?.point
          }
          address={noteData?.location?.address}
          onLocationChange={(v) =>
            setValue('location', v, { shouldDirty: true })
          }
          scrollRef={scrollRef}
          expanded={expanded}
          setExpanded={setExpanded}
          errors={errors}
          setErrors={setErrors}
        />
        <RequestedProvidedServices
          scrollRef={scrollRef}
          services={form.providedServices}
          onServicesChange={(v) =>
            setValue('providedServices', v, { shouldDirty: true })
          }
          type={ServiceRequestTypeEnum.Provided}
        />
        <RequestedProvidedServices
          scrollRef={scrollRef}
          services={form.requestedServices}
          onServicesChange={(v) =>
            setValue('requestedServices', v, { shouldDirty: true })
          }
          type={ServiceRequestTypeEnum.Requested}
        />
        <NoteTasks
          clientProfileId={clientProfileId}
          scrollRef={scrollRef}
          tasks={form.tasks}
          team={form.team}
          isDraftMode
          onDraftTasksChange={(v) =>
            setValue('tasks', v, { shouldDirty: true })
          }
        />
        <PublicNote
          note={form.publicNote}
          onPublicNoteChange={(v) =>
            setValue('publicNote', v, { shouldDirty: true })
          }
          noteId={noteId}
          isPublicNoteEdited={isPublicNoteEdited}
          setIsPublicNoteEdited={setIsPublicNoteEdited}
          expanded={expanded}
          setExpanded={setExpanded}
          scrollRef={scrollRef}
          purpose={form.purpose}
          providedServices={noteData?.providedServices}
          requestedServices={noteData?.requestedServices}
        />
      </MainScrollContainer>
      <BottomActions
        cancel={
          isEditing ? (
            <DiscardModal
              title="Discard changes?"
              body="Any unsaved changes to this interaction will be lost."
              onDiscard={onBack}
              button={
                <TextButton
                  fontSize="sm"
                  accessibilityHint="discards changes and goes back"
                  title="Cancel"
                />
              }
            />
          ) : (
            <DiscardModal
              title="Discard interaction?"
              body="All data in this interaction will be lost."
              onDiscard={isNewNote ? onDiscard : onDelete}
              button={
                <TextButton
                  fontSize="sm"
                  accessibilityHint="discards interaction"
                  title="Cancel"
                />
              }
            />
          )
        }
        optionalAction={
          !isSubmitted && (
            <TextButton
              mr="sm"
              fontSize="sm"
              onPress={onSaveDraft}
              accessibilityHint="saves the interaction as a draft"
              title="Save as Draft"
            />
          )
        }
        onSubmit={handleSubmit}
      />
    </View>
  );
}
