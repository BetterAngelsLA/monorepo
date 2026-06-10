import { memo } from 'react';
import { Dropdown } from '../../../base-ui/dropdown';
import { FormSection } from '../../../form/FormSection';
import { TextAreaField } from '../../../form/TextAreaField';
import { TextField } from '../../../form/TextField';
import {
  BED_STATUS_OPTIONS,
  BED_TYPE_OPTIONS,
  MEDICAL_NEED_OPTIONS,
} from '../constants/bedFormOptions';
import type { SectionProps } from '../types';

export const BasicInformationSection = memo(function BasicInformationSection({
  data,
  onChange,
  errors,
  roomOptions,
}: SectionProps) {
  return (
    <FormSection title="Basic Information">
      <TextField
        id="bed-name"
        name="name"
        label="Bed Name"
        value={data.name}
        onChange={(value) => onChange('name', value)}
        error={errors.name}
      />
      <Dropdown
        label="Room"
        placeholder="Unassigned"
        options={roomOptions}
        value={
          data.roomId
            ? roomOptions.find((o) => o.value === data.roomId) ?? null
            : null
        }
        onChange={(option) => {
          onChange('roomId', option ? option.value : null);
        }}
      />
      <p className="text-sm text-gray-600">
        Optional. Leave unassigned if the bed is not in a room yet.
      </p>
      <Dropdown
        label="Status"
        placeholder="Select a status"
        options={BED_STATUS_OPTIONS}
        value={
          data.status
            ? BED_STATUS_OPTIONS.find((o) => o.value === data.status) ?? null
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
        label="Bed Type"
        placeholder="Select a bed type"
        options={BED_TYPE_OPTIONS}
        value={
          data.type
            ? BED_TYPE_OPTIONS.find((o) => o.value === data.type) ?? null
            : null
        }
        onChange={(option) => {
          onChange('type', option ? option.value : null);
        }}
      />
      {errors.type ? (
        <p className="text-sm text-red-600">{errors.type}</p>
      ) : null}
      <Dropdown
        label="Medical Needs"
        placeholder="Select medical needs"
        isMulti={true}
        options={MEDICAL_NEED_OPTIONS}
        value={MEDICAL_NEED_OPTIONS.filter((o) =>
          data.medicalNeeds.includes(o.value)
        )}
        onChange={(options) => {
          onChange('medicalNeeds', options ? options.map((o) => o.value) : []);
        }}
      />
      {errors.medicalNeeds ? (
        <p className="text-sm text-red-600">{errors.medicalNeeds}</p>
      ) : null}
      <TextAreaField
        id="bed-status-notes"
        name="statusNotes"
        label="Status Notes"
        value={data.statusNotes}
        onChange={(value) => onChange('statusNotes', value)}
        rows={3}
      />
    </FormSection>
  );
});
