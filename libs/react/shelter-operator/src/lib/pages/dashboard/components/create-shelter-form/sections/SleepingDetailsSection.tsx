import { RoomStyleChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import { Dropdown } from '../../../../../components/base-ui/dropdown/Dropdown';
import { Input } from '../../../../../components/base-ui/input/Input';
import { FormSection } from '../../../../../components/form/FormSection';
import { ROOM_STYLES_OPTIONS } from '../../../formOptions';
import type { SectionProps } from '../types';

const DROPDOWN_OTHER_VALUE = '__dropdown_other__';

const selectedOptions = <T extends string>(
  options: { value: T; label: string }[],
  values: T[]
) => options.filter((option) => values.includes(option.value));

const toValues = <T extends string>(
  values: Array<{ value: string; label: string }> | null,
  mappedOtherValue?: T
) => {
  const next = new Set<T>();

  (values ?? []).forEach((option) => {
    if (option.value === DROPDOWN_OTHER_VALUE) {
      if (mappedOtherValue) {
        next.add(mappedOtherValue);
      }
      return;
    }
    next.add(option.value as T);
  });

  return Array.from(next);
};

export const SleepingDetailsSection = memo(function SleepingDetailsSection({
  data,
  onChange,
  errors,
  isTouched,
}: SectionProps) {
  return (
    <FormSection
      title="Sleeping Details"
      className="rounded-none border-0 bg-transparent p-0"
      contentClassName="space-y-6 py-6"
      titleClassName=""
    >
      <Input
        id="total-beds"
        label="Total Beds"
        type="number"
        inputMode="numeric"
        value={data.totalBeds ?? ''}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange('totalBeds', nextValue === '' ? null : Number(nextValue));
        }}
        min={0}
        error={errors.totalBeds}
        isTouched={isTouched}
      />

      <Dropdown
        label="Room Styles"
        placeholder="Please select"
        options={ROOM_STYLES_OPTIONS}
        value={selectedOptions(ROOM_STYLES_OPTIONS, data.roomStyles)}
        onChange={(values) => {
          const nextValues = toValues<RoomStyleChoices>(
            values,
            RoomStyleChoices.Other
          );
          onChange('roomStyles', nextValues);

          if (
            !nextValues.includes(RoomStyleChoices.Other) &&
            data.roomStylesOther
          ) {
            onChange('roomStylesOther', '');
          }
        }}
        onOtherTextChange={(text) => onChange('roomStylesOther', text)}
        isMulti
      />

      <Input
        id="sleeping-notes"
        variant="paragraph"
        label="Additional Notes"
        placeholder="Additional Notes"
        value={data.addNotesSleepingDetails}
        onChange={(event) =>
          onChange('addNotesSleepingDetails', event.target.value)
        }
        rows={3}
      />
    </FormSection>
  );
});
