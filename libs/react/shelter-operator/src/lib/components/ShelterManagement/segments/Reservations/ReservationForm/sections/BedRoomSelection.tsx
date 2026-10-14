import { memo } from 'react';
import { Controller } from 'react-hook-form';
import type { DropdownOption } from '../../../../../base-ui/dropdown';
import { Dropdown } from '../../../../../base-ui/dropdown';
import { Input } from '../../../../../base-ui/input';
import { FormSection } from '../../../../../form/FormSection';
import { TextField } from '../../../../../form/TextField';
import type { SectionProps } from '../types';

export type BedRoomSelectionProps = SectionProps & {
  bedOptions: DropdownOption<string>[];
  roomOptions: DropdownOption<string>[];
  bedRoomError?: string;
  readOnlyFields?: ('bedId' | 'roomId')[];
};

export const BedRoomSelection = memo(function BedRoomSelection({
  control,
  errors,
  bedOptions,
  roomOptions,
  bedRoomError,
  readOnlyFields = [],
}: BedRoomSelectionProps) {
  return (
    <FormSection title="Reservation Details">
      <Controller
        name="roomId"
        control={control}
        render={({ field }) => (
          <Dropdown
            label="Room"
            placeholder="Select a room"
            options={roomOptions}
            disabled={readOnlyFields.includes('roomId')}
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
        Optional. At least one of Room or Bed must be selected.
      </p>
      <Controller
        name="bedId"
        control={control}
        render={({ field }) => (
          <Dropdown
            label="Bed"
            placeholder="Select a bed"
            options={bedOptions}
            disabled={readOnlyFields.includes('bedId')}
            value={
              field.value
                ? (bedOptions.find((o) => o.value === field.value) ?? null)
                : null
            }
            onChange={(option) => {
              field.onChange(option ? option.value : null);
            }}
          />
        )}
      />
      <p className="text-sm text-gray-600">
        Optional. At least one of Room or Bed must be selected.
      </p>

      {bedRoomError && <p className="text-sm text-red-600">{bedRoomError}</p>}

      <Controller
        name="startDate"
        control={control}
        render={({ field }) => (
          <TextField
            id="reservation-start-date"
            name="startDate"
            label="Start Date"
            type="date"
            value={field.value}
            onChange={field.onChange}
            error={errors.startDate?.message}
            required
          />
        )}
      />

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <Input
            name="notes"
            label="Notes"
            value={field.value}
            onChange={field.onChange}
            variant="paragraph"
          />
        )}
      />
    </FormSection>
  );
});
