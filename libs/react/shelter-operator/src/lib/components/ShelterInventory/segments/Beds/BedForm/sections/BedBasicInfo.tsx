import { memo } from 'react';
import { Controller } from 'react-hook-form';
import type { DropdownOption } from '../../../../../base-ui/dropdown';
import { Dropdown } from '../../../../../base-ui/dropdown';
import { FormSection } from '../../../../../form/FormSection';
import { TextAreaField } from '../../../../../form/TextAreaField';
import { TextField } from '../../../../../form/TextField';
import { BED_TYPE_OPTIONS } from '../formSchema';
import type { SectionProps } from '../types';

export type TProps = SectionProps & {
  roomOptions: DropdownOption<string>[];
};

export const BedBasicInfo = memo(function BedBasicInfo({
  control,
  errors,
  roomOptions,
}: TProps) {
  return (
    <FormSection title="Basic Information">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            id="bed-name"
            name="name"
            label="Bed Name"
            value={field.value}
            onChange={field.onChange}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        name="roomId"
        control={control}
        render={({ field }) => (
          <Dropdown
            label="Room"
            placeholder="Unassigned"
            options={roomOptions}
            value={
              field.value
                ? (roomOptions.find((o) => o.value === field.value) ?? null)
                : null
            }
            onChange={(option) => {
              field.onChange(option ? option.value : null);
            }}
          />
        )}
      />
      <p className="text-sm text-gray-600">
        Optional. Leave unassigned if the bed is not in a room yet.
      </p>

      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Dropdown
            label="Bed Type"
            placeholder="Select a bed type"
            options={BED_TYPE_OPTIONS}
            value={
              field.value
                ? (BED_TYPE_OPTIONS.find((o) => o.value === field.value) ??
                  null)
                : null
            }
            onChange={(option) => {
              field.onChange(option ? option.value : null);
            }}
          />
        )}
      />
      {errors.type ? (
        <p className="text-sm text-red-600">{errors.type.message}</p>
      ) : null}

      <Controller
        name="statusNotes"
        control={control}
        render={({ field }) => (
          <TextAreaField
            id="bed-status-notes"
            name="statusNotes"
            label="Status Notes"
            value={field.value}
            onChange={field.onChange}
            rows={3}
          />
        )}
      />
    </FormSection>
  );
});
