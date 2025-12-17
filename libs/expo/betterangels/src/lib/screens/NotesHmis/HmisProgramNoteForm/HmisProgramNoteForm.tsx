import { Spacings } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  DatePicker,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { ServiceRequestTypeEnum, UpdateTaskInput } from '../../../apollo';
import { useHmisClientPrograms } from '../../../hooks';
import { useModalScreen } from '../../../providers';
import { GirpNoteForm, NoteTasks } from '../../../ui-components';
import { FORM_KEYS } from './constants';
import {
  LocalDraftTask,
  THmisProgramNoteFormInputs,
  hmisProgramNoteFormEmptyState,
} from './formSchema';
import HmisProvidedServices from './HmisProvidedServices';
import HmisRequestedServices from './HmisRequestedServices';
import { FieldCardHmisNote } from './shared/FieldCardHmisNote';
import { renderValue } from './shared/renderValue';
import { TFormKeys } from './types';

type TProps = {
  clientId: string;
  disabled?: boolean;
  editing?: boolean;
  noteId?: string;
  existingTasks?: (UpdateTaskInput | LocalDraftTask)[];
  refetch?: () => void;
};

export function HmisProgramNoteForm(props: TProps) {
  const { clientId, disabled, editing, noteId, existingTasks, refetch } = props;

  const {
    control,
    watch,
    setValue,
    clearErrors,
    getFieldState,
    formState: { errors, isSubmitting, submitCount },
  } = useFormContext<THmisProgramNoteFormInputs>();

  const router = useRouter();
  const { showModalScreen } = useModalScreen();
  const [expandedField, setExpandedField] = useState<TFormKeys | null>(null);
  const [enrollmentsError, setProgramsError] = useState<string | undefined>(
    undefined
  );

  const tasksScrollRef = useRef<ScrollView>(null);

  const titleValue = watch('title') || '';
  const refClientProgramValue = watch('refClientProgram') || '';
  const dateYmd = watch('date') || '';
  const noteValue = watch('note') || '';
  const services = watch('services') || {};

  const {
    clientPrograms,
    totalPrograms,
    getProgramNameByEnrollmentId,
    loading: programsLoading,
    error: programEnrollmentError,
  } = useHmisClientPrograms({ clientId });

  const formDisabled = disabled || !!enrollmentsError || isSubmitting;

  useEffect(() => {
    if (editing) {
      return;
    }
    if (programEnrollmentError) {
      setProgramsError('Sorry, something went wrong. Please try again.');
      return;
    }
    if (totalPrograms === 0) {
      setProgramsError('The user is not enrolled in any clientPrograms.');
      return;
    }
    setProgramsError(undefined);
  }, [programEnrollmentError, totalPrograms, editing]);

  useEffect(() => {
    if (!refClientProgramValue || !clientPrograms?.length) {
      return;
    }
    const optionExists = clientPrograms.some(
      (p) => p.id === refClientProgramValue
    );
    if (optionExists) {
      return;
    }
    const { isDirty, isTouched } = getFieldState('refClientProgram');
    const userHasInteracted = isDirty || isTouched || submitCount > 0;

    if (!userHasInteracted) {
      setValue('refClientProgram', '', {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      clearErrors('refClientProgram');
      return;
    }
    setValue('refClientProgram', '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [
    clientPrograms,
    refClientProgramValue,
    setValue,
    clearErrors,
    getFieldState,
    submitCount,
  ]);

  function handleGirpFormOpen() {
    if (formDisabled) {
      return;
    }
    if (expandedField === FORM_KEYS.note) {
      setExpandedField(null);
      return;
    }
    showModalScreen({
      presentation: 'card',
      title: 'Note',
      content: () => (
        <GirpNoteForm
          note={noteValue}
          disabled={formDisabled}
          purpose={titleValue}
          onDone={(newNote) => {
            setValue('note', newNote, {
              shouldDirty: true,
              shouldValidate: true,
              shouldTouch: true,
            });
            router.back();
          }}
        />
      ),
    });
  }

  function toggleFieldExpanded(key: TFormKeys) {
    if (formDisabled) {
      return;
    }
    const value = key === expandedField ? null : key;
    setExpandedField(value);
  }

  const hideProgram =
    editing && !getProgramNameByEnrollmentId(refClientProgramValue);

  return (
    <Form style={{ gap: Spacings.xs }}>
      <FieldCardHmisNote
        required
        disabled={formDisabled}
        title="Title"
        value={titleValue}
        actionName="Add Title"
        onPress={() => toggleFieldExpanded(FORM_KEYS.title)}
        expanded={expandedField === FORM_KEYS.title}
        error={errors.title?.message}
      >
        <ControlledInput
          name="title"
          required
          control={control}
          disabled={formDisabled}
          placeholder="Enter title"
          onDelete={() => {
            setValue('title', hmisProgramNoteFormEmptyState.title);
          }}
        />
      </FieldCardHmisNote>

      <FieldCardHmisNote
        required
        disabled={formDisabled}
        title="Date"
        value={renderValue({ value: dateYmd })}
        actionName="Add Date"
        onPress={() => toggleFieldExpanded(FORM_KEYS.date)}
        expanded={expandedField === FORM_KEYS.date}
        error={errors.date?.message}
      >
        <DatePicker
          name="date"
          control={control}
          type="numeric"
          placeholder='Enter date'
          disabled={formDisabled}
        />
      </FieldCardHmisNote>

      <HmisProvidedServices
        services={
          services[ServiceRequestTypeEnum.Provided]?.serviceRequests || []
        }
      />
      <HmisRequestedServices
        services={
          services[ServiceRequestTypeEnum.Requested]?.serviceRequests || []
        }
      />

      {!hideProgram && (
        <FieldCardHmisNote
          disabled={formDisabled || !clientPrograms?.length || editing}
          loading={programsLoading}
          title="Program"
          value={getProgramNameByEnrollmentId(refClientProgramValue) || ''}
          actionName="Add Program"
          onPress={() => toggleFieldExpanded(FORM_KEYS.refClientProgram)}
          expanded={expandedField === FORM_KEYS.refClientProgram}
          error={errors.refClientProgram?.message || enrollmentsError}
        >
          <Controller
            name="refClientProgram"
            control={control}
            render={({ field: { value, onChange } }) => {
              return (
                <SingleSelect
                  disabled={formDisabled || !clientPrograms?.length}
                  maxRadioItems={0}
                  placeholder="Select a program"
                  selectedValue={value}
                  items={(clientPrograms || []).map(({ id, program }) => {
                    return {
                      // FIX 2: Use fallback string instead of '!' assertion
                      value: id || '',
                      displayValue: program?.name || `Program ${id}`,
                    };
                  })}
                  onChange={onChange}
                />
              );
            }}
          />
        </FieldCardHmisNote>
      )}

      <FieldCardHmisNote
        required
        disabled={formDisabled}
        title="Note"
        value={noteValue}
        actionName="Add Note"
        onPress={handleGirpFormOpen}
        expanded={false}
        error={errors.note?.message}
      />

      {/* --- TASK SECTION --- */}
      {editing ? (
        // LIVE MODE
        <NoteTasks
          isDraftMode={false}
          hmisClientProfileId={clientId}
          scrollRef={tasksScrollRef}
          tasks={existingTasks || []}
          hmisNoteId={noteId}
          refetch={refetch}
        />
      ) : (
        // DRAFT MODE
        <Controller
          control={control}
          name="draftTasks"
          render={({ field: { value, onChange } }) => (
            <NoteTasks
              isDraftMode={true}
              hmisClientProfileId={clientId}
              scrollRef={tasksScrollRef}
              tasks={value || []}
              onDraftTasksChange={onChange}
            />
          )}
        />
      )}
    </Form>
  );
}
