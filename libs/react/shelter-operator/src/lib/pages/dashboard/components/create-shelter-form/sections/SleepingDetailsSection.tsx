import { RoomStyleChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import { ROOM_STYLES_OPTIONS } from '../../../formOptions';
import { CheckboxGroup } from '../../../../../components/form/CheckboxGroup';
import { FormSection } from '../../../../../components/form/FormSection';
import { NumberField } from '../../../../../components/form/NumberField';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import { TextField } from '../../../../../components/form/TextField';
import type { SectionProps } from '../types';

export const SleepingDetailsSection = memo(function SleepingDetailsSection({
  data,
  onChange,
  errors,
}: SectionProps) {
  return (
    <FormSection title="Sleeping Details">
      <NumberField
        id="total-beds"
        name="totalBeds"
        label="Total Beds"
        value={data.totalBeds}
        onChange={(value) => onChange('totalBeds', value)}
        min={0}
        error={errors.totalBeds}
      />
      <CheckboxGroup
        name="room-styles"
        label="Room Styles"
        options={ROOM_STYLES_OPTIONS}
        values={data.roomStyles}
        onChange={(values) => {
          onChange('roomStyles', values);
          if (!values.includes(RoomStyleChoices.Other) && data.roomStylesOther) {
            onChange('roomStylesOther', '');
          }
        }}
      />
      {data.roomStyles.includes(RoomStyleChoices.Other) ? (
        <TextField
          id="room-styles-other"
          name="roomStylesOther"
          label="Other Room Styles"
          value={data.roomStylesOther}
          onChange={(value) => onChange('roomStylesOther', value)}
        />
      ) : null}
      <TextAreaField
        id="sleeping-notes"
        name="addNotesSleepingDetails"
        label="Additional Notes"
        value={data.addNotesSleepingDetails}
        onChange={(value) => onChange('addNotesSleepingDetails', value)}
        rows={3}
      />
    </FormSection>
  );
});
