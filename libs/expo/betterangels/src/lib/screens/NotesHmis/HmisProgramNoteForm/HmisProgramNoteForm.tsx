import { Spacings } from '@monorepo/expo/shared/static';
import {
  ControlledInput,
  DatePicker,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useHmisClientPrograms } from '../../../hooks';
import { useModalScreen } from '../../../providers';
import { GirpNoteForm } from '../../../ui-components';
import { FORM_KEYS } from './constants';
import { TFormInput, hmisProgramNoteFormEmptyState } from './formSchema';
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
    formState: { errors, isSubmitting },
  } = useFormContext<TFormInput>();

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
    error: programEnrollmentError,
  } = useHmisClientPrograms({
    hmisClientId: hmisClientId,
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

  useEffect(() => {
    if (!enrollmentIdValue) {
      return;
    }

    // Clear the enrollmentId if not found in the current list of programs
    const programList = programs || [];

    const optionExists = programList.some((p) => p.id === enrollmentIdValue);

    if (!optionExists) {
      const optionNames = programList.map((p) => p.name).join(', ');

      console.warn(
        `HmisProgramNoteForm: selected program [${enrollmentIdValue}] does not exist in options: ${optionNames}`
      );

      setValue('enrollmentId', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [programs, enrollmentIdValue, setValue]);

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

  const selectedProgramLabel = useMemo(() => {
    if (!enrollmentIdValue || !programs?.length) {
      return '';
    }

    const selectedProgram = programs.find((program) => {
      return program.id === enrollmentIdValue;
    });

    return selectedProgram?.name || '';
  }, [enrollmentIdValue, programs]);

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
        title="Program"
        value={selectedProgramLabel}
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
                items={(programs || []).map(({ id, name }) => {
                  return {
                    value: id,
                    displayValue: name,
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
