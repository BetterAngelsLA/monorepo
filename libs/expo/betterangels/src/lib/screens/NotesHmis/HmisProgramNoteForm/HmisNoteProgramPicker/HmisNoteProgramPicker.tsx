import { SingleSelect } from '@monorepo/expo/shared/ui-components';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

const PROGRAM_VALUES = ['PROGRAM_1', 'PROGRAM_2', 'PROGRAM_3'];

const PROGRAM_ITEMS = PROGRAM_VALUES.map((programCode) => ({
  value: programCode,
  displayValue: programCode,
}));

type HmisNoteProgramPickerProps<TFormValues extends FieldValues> = {
  hmisClientId: string;
  control: Control<TFormValues>;
  disabled?: boolean;
};

export function HmisNoteProgramPicker<TFormValues extends FieldValues>(
  props: HmisNoteProgramPickerProps<TFormValues>
) {
  const { hmisClientId, control, disabled = false } = props;

  // hmisClientId for fetcheing live data later
  void hmisClientId;

  return (
    <Controller
      name={'program' as Path<TFormValues>}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        return (
          <SingleSelect
            maxRadioItems={0}
            placeholder="Select a program"
            items={PROGRAM_ITEMS}
            selectedValue={value}
            onChange={onChange}
          />
        );
      }}
    />
  );
}
