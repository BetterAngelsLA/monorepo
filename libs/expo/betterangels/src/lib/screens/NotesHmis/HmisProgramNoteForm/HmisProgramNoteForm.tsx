import { Spacings } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  DatePicker,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useHmisClientPrograms } from '../../../hooks';
import { useModalScreen } from '../../../providers';
import { GirpNoteForm } from '../../../ui-components';
import { FORM_KEYS } from './constants';
import {
  THmisProgramNoteFormInputs,
  hmisProgramNoteFormEmptyState,
} from './formSchema';
import { FieldCardHmisNote } from './shared/FieldCardHmisNote';
import { renderValue } from './shared/renderValue';
import { TFormKeys } from './types';

type TProps = {
  hmisClientId: string;
  disabled?: boolean;
};

export function HmisProgramNoteForm(props: TProps) {
  const { hmisClientId, disabled } = props;

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
  const [programsError, setProgramsError] = useState<string | undefined>(
    undefined
  );

  const titleValue = watch('title') || '';
  const enrollmentIdValue = watch('enrollmentId') || '';
  const dateYmd = watch('date') || '';
  const noteValue = watch('note') || '';

  const {
    programs,
    totalPrograms,
    getProgramNameByEnrollmentId,
    loading: programsLoading,
    error: programEnrollmentError,
  } = useHmisClientPrograms({
    hmisClientId,
  });

  // NOTE: client program options required to process form
  const formDisabled = disabled || !!programsError || isSubmitting;

  useEffect(() => {
    if (programEnrollmentError) {
      setProgramsError('Sorry, something went wrong. Please try again.');

      return;
    }

    if (totalPrograms === 0) {
      setProgramsError('The user is not enrolled in any programs.');

      return;
    }

    setProgramsError(undefined);
  }, [programEnrollmentError, totalPrograms]);

  // Clear selected enrollmentId if not found in programs
  useEffect(() => {
    if (!enrollmentIdValue || !programs?.length) {
      return;
    }

    const optionExists = programs.some(
      (p) => p.enrollmentId === enrollmentIdValue
    );

    // all ok
    if (optionExists) {
      return;
    }

    const optionNames = programs.map((p) => p.project?.projectName).join(', ');

    console.warn(
      `HmisProgramNoteForm: selected program enrollmentId [${enrollmentIdValue}] does not exist in options: ${optionNames}`
    );

    const { isDirty, isTouched } = getFieldState('enrollmentId');

    const userHasInteracted = isDirty || isTouched || submitCount > 0;

    if (!userHasInteracted) {
      // Silent reset if user hasn't touched the field
      setValue('enrollmentId', '', {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });

      clearErrors('enrollmentId');

      return;
    }

    // User has interacted (or tried to submit) so revalidate to show error
    setValue('enrollmentId', '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [
    programs,
    enrollmentIdValue,
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

  return (
    <Form style={{ gap: Spacings.xs }}>
      <FieldCardHmisNote
        required
        disabled={formDisabled}
        title="Purpose"
        value={titleValue}
        actionName="Add Purpose"
        onPress={() => toggleFieldExpanded(FORM_KEYS.title)}
        expanded={expandedField === FORM_KEYS.title}
        error={errors.title?.message}
      >
        <ControlledInput
          name="title"
          required
          control={control}
          disabled={formDisabled}
          placeholder="Enter purpose"
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
          disabled={formDisabled}
        />
      </FieldCardHmisNote>

      <FieldCardHmisNote
        required
        disabled={formDisabled || !programs?.length}
        loading={programsLoading}
        title="Program"
        value={getProgramNameByEnrollmentId(enrollmentIdValue) || ''}
        actionName="Add Program"
        onPress={() => toggleFieldExpanded(FORM_KEYS.enrollmentId)}
        expanded={expandedField === FORM_KEYS.enrollmentId}
        error={errors.enrollmentId?.message || programsError}
      >
        <Controller
          name="enrollmentId"
          control={control}
          render={({ field: { value, onChange } }) => {
            return (
              <SingleSelect
                disabled={formDisabled || !programs?.length}
                maxRadioItems={0}
                placeholder="Select a program"
                selectedValue={value}
                items={(programs || []).map(({ enrollmentId, project }) => {
                  return {
                    value: enrollmentId!,
                    displayValue:
                      project?.projectName || `Project ${enrollmentId}`,
                  };
                })}
                onChange={onChange}
              />
            );
          }}
        />
      </FieldCardHmisNote>

      <FieldCardHmisNote
        required
        disabled={formDisabled}
        title="Note"
        value={noteValue}
        actionName="Add Note"
        onPress={handleGirpFormOpen}
        expanded={false} // never expands on click; opens form instead
        error={errors.note?.message}
      />
    </Form>
  );
}
