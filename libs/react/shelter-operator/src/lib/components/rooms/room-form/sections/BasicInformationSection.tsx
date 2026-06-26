import { RoomStyleChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { ROOM_STYLES_OPTIONS } from '../../../../pages/dashboard/formOptions';
import { Dropdown } from '../../../base-ui/dropdown';
import { Input } from '../../../base-ui/input';
import { FormSection } from '../../../form/FormSection';
import { RadioGroup } from '../../../form/RadioGroup';
import { TextAreaField } from '../../../form/TextAreaField';
import { TextField } from '../../../form/TextField';
import { BOOLEAN_OPTIONS } from '../constants/roomFormOptions';
import type { RoomFormData } from '../formTypes';
import type { SectionProps } from '../types';

export const BasicInformationSection = memo(function BasicInformationSection({
  control,
  errors,
}: SectionProps) {
  const { setValue } = useFormContext<RoomFormData>();
  const currentType = useWatch({ name: 'type', control });

  return (
    <FormSection title="Basic Information">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            id="room-name"
            name="name"
            label="Room"
            value={field.value}
            onChange={field.onChange}
            error={errors.name?.message}
            required
          />
        )}
      />

      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Dropdown
            label="Room Type"
            placeholder="Select a room type"
            options={ROOM_STYLES_OPTIONS}
            value={
              field.value
                ? ROOM_STYLES_OPTIONS.find((o) => o.value === field.value) ??
                  null
                : null
            }
            onChange={(option) => {
              const nextType = option ? option.value : null;
              field.onChange(nextType);
              if (nextType !== RoomStyleChoices.Other) {
                setValue('typeOther', '');
              }
            }}
          />
        )}
      />

      {currentType === RoomStyleChoices.Other ? (
        <Controller
          name="typeOther"
          control={control}
          render={({ field }) => (
            <Input
              name="typeOther"
              label="Other Room Type"
              value={field.value}
              onChange={field.onChange}
              variant="paragraph"
            />
          )}
        />
      ) : null}

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <TextAreaField
            id="room-notes"
            name="notes"
            label="Notes"
            value={field.value}
            onChange={field.onChange}
            rows={3}
          />
        )}
      />

      <Controller
        name="amenities"
        control={control}
        render={({ field }) => (
          <TextAreaField
            id="room-amenities"
            name="amenities"
            label="Amenities"
            value={field.value}
            onChange={field.onChange}
            rows={2}
          />
        )}
      />
      <p className="text-sm text-gray-600">
        Optional. Separate multiple amenities with commas.
      </p>

      <Controller
        name="medicalRespite"
        control={control}
        render={({ field }) => (
          <RadioGroup
            name="medicalRespite"
            label="Medical Respite"
            options={BOOLEAN_OPTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </FormSection>
  );
});
