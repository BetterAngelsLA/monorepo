import {
  ControlledInput,
  DatePicker,
  Form,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { HmisNoteProgramPicker } from './HmisNoteProgramPicker';
import { TFormInput, hmisProgramNoteFormEmptyState } from './formSchema';
import { FieldCardHmisNote } from './shared/FieldCardHmisNote';
import { renderValue } from './shared/renderValue';

type TFormKeys = keyof typeof hmisProgramNoteFormEmptyState;

export const FORM_KEYS = {
  title: 'title',
  date: 'date',
  program: 'program',
  note: 'note',
} as const satisfies { [K in TFormKeys]: K };

export function HmisProgramNoteForm() {
  const {
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<TFormInput>();

  const [expandedField, setExpandedField] = useState<TFormKeys | null>(null);

  const titleValue = watch('title') || '';
  const programValue = watch('program') || '';
  const dateYmd = watch('date') || '';

  useEffect(() => {
    console.log('*******  FORM input DATE VALUE dateYmd CHANGE: ', dateYmd);
  }, [dateYmd]);

  useEffect(() => {
    console.log(
      '*******  FORM input DATE VALUE programValue CHANGE: ',
      programValue
    );
  }, [programValue]);

  function toggleFieldExpanded(key: TFormKeys) {
    const value = key === expandedField ? null : key;

    setExpandedField(value);
  }

  return (
    <Form>
      <FieldCardHmisNote
        required
        title="Purpose"
        value={titleValue}
        actionName="Add Purpose"
        onPress={() => toggleFieldExpanded(FORM_KEYS.title)}
        expanded={expandedField === FORM_KEYS.title}
        error={errors.title?.message}
        mb="xs"
      >
        <ControlledInput
          name="title"
          required
          control={control}
          disabled={isSubmitting}
          placeholder="Enter purpose"
          onDelete={() => {
            setValue('title', hmisProgramNoteFormEmptyState.title);
          }}
        />
      </FieldCardHmisNote>

      <FieldCardHmisNote
        required
        title="Date"
        value={renderValue({ value: dateYmd })}
        actionName="Add Date"
        onPress={() => toggleFieldExpanded(FORM_KEYS.date)}
        expanded={expandedField === FORM_KEYS.date}
        error={errors.date?.message}
        mb="xs"
      >
        <DatePicker name="date" control={control} type="numeric" />
      </FieldCardHmisNote>

      <FieldCardHmisNote
        required
        title="Program"
        value={programValue}
        actionName="Add Program"
        onPress={() => toggleFieldExpanded(FORM_KEYS.program)}
        expanded={expandedField === FORM_KEYS.program}
        error={errors.program?.message}
        mb="xs"
      >
        <HmisNoteProgramPicker hmisClientId="asdf" control={control} />
      </FieldCardHmisNote>
    </Form>
  );
}
