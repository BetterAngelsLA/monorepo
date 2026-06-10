import { RoomStyleChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import { ROOM_STYLES_OPTIONS } from '../../../../pages/dashboard/formOptions';
import { Dropdown } from '../../../base-ui/dropdown';
import { FormSection } from '../../../form/FormSection';
import { RadioGroup } from '../../../form/RadioGroup';
import { TextAreaField } from '../../../form/TextAreaField';
import { TextField } from '../../../form/TextField';
import {
  BOOLEAN_OPTIONS,
  ROOM_STATUS_OPTIONS,
} from '../constants/roomFormOptions';
import type { SectionProps } from '../types';

export const BasicInformationSection = memo(function BasicInformationSection({
  data,
  onChange,
  errors,
}: SectionProps) {
  return (
    <FormSection title="Basic Information">
      <TextField
        id="room-name"
        name="name"
        label="Room Name"
        value={data.name}
        onChange={(value) => onChange('name', value)}
        error={errors.name}
        required
      />
      <Dropdown
        label="Status"
        placeholder="Select a status"
        options={ROOM_STATUS_OPTIONS}
        value={
          data.status
            ? ROOM_STATUS_OPTIONS.find((o) => o.value === data.status) ?? null
            : null
        }
        onChange={(option) => {
          if (option) onChange('status', option.value);
        }}
      />
      {errors.status ? (
        <p className="text-sm text-red-600">{errors.status}</p>
      ) : null}
      <Dropdown
        label="Room Type"
        placeholder="Select a room type"
        options={ROOM_STYLES_OPTIONS}
        value={
          data.type
            ? ROOM_STYLES_OPTIONS.find((o) => o.value === data.type) ?? null
            : null
        }
        onChange={(option) => {
          const nextType = option ? option.value : null;
          onChange('type', nextType);
          if (nextType !== RoomStyleChoices.Other && data.typeOther) {
            onChange('typeOther', '');
          }
        }}
      />
      {data.type === RoomStyleChoices.Other ? (
        <TextField
          id="room-type-other"
          name="typeOther"
          label="Other Room Type"
          value={data.typeOther}
          onChange={(value) => onChange('typeOther', value)}
        />
      ) : null}
      <TextAreaField
        id="room-notes"
        name="notes"
        label="Notes"
        value={data.notes}
        onChange={(value) => onChange('notes', value)}
        rows={3}
      />
      <TextAreaField
        id="room-amenities"
        name="amenities"
        label="Amenities"
        value={data.amenities}
        onChange={(value) => onChange('amenities', value)}
        rows={2}
      />
      <p className="text-sm text-gray-600">
        Optional. Separate multiple amenities with commas.
      </p>
      <RadioGroup
        name="medicalRespite"
        label="Medical Respite"
        options={BOOLEAN_OPTIONS}
        value={data.medicalRespite}
        onChange={(value) => onChange('medicalRespite', value)}
      />
    </FormSection>
  );
});
