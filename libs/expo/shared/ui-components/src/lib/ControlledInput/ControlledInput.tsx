import {
  Control,
  Controller,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';
import { IInputProps, Input } from '../Input';

interface IControlledInputProps<T extends FieldValues = FieldValues>
  extends IInputProps {
  name: Path<T>;
  control?: Control<T>;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
  >;
  onBlur?: () => void;
}

export function ControlledInput<T extends FieldValues = FieldValues>(
  props: IControlledInputProps<T>
) {
  const { rules, name, control, ...rest } = props;

  const handleBlur = (onBlur: () => void) => {
    onBlur();
    if (props.onBlur) {
      props.onBlur();
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onBlur, onChange } }) => (
        <Input
          onChangeText={onChange}
          value={value}
          onBlur={() => handleBlur(onBlur)}
          {...rest}
        />
      )}
    />
  );
}
