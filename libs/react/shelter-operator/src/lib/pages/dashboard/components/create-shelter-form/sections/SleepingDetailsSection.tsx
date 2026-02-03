import { ROOM_STYLES_OPTIONS } from '../../../types';
import { RoomStyleChoices } from '@monorepo/react/shelter';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { FormSection } from '../components/FormSection';
import { NumberField } from '../components/NumberField';
import { TextAreaField } from '../components/TextAreaField';
import { TextField } from '../components/TextField';
import type { SectionProps } from '../types';

export function SleepingDetailsSection({ data, onChange, errors }: SectionProps) {
  return (
    <FormSection title="Sleeping Details">
      <NumberField
        id="total-beds"
        name="total_beds"
        label="Total Beds"
        value={data.total_beds}
        onChange={value => onChange('total_beds', value)}
        min={0}
        error={errors.total_beds}
      />
      <CheckboxGroup
        name="room-styles"
        label="Room Styles"
        options={ROOM_STYLES_OPTIONS}
        values={data.room_styles}
        onChange={values => {
          onChange('room_styles', values);
          if (!values.includes(RoomStyleChoices.Other) && data.room_styles_other) {
            onChange('room_styles_other', '');
          }
        }}
      />
      {data.room_styles.includes(RoomStyleChoices.Other) ? (
        <TextField
          id="room-styles-other"
          name="room_styles_other"
          label="Other Room Styles"
          value={data.room_styles_other}
          onChange={value => onChange('room_styles_other', value)}
        />
      ) : null}
      <TextAreaField
        id="sleeping-notes"
        name="add_notes_sleeping_details"
        label="Additional Notes"
        value={data.add_notes_sleeping_details}
        onChange={value => onChange('add_notes_sleeping_details', value)}
        rows={3}
      />
    </FormSection>
  );
}
