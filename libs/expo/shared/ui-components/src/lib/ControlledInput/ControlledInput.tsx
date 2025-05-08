import { Control, Controller, RegisterOptions } from 'react-hook-form';
import { IInputProps, Input } from '../Input';

type TRules = Omit<
  RegisterOptions,
  'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
>;

interface IControlledInputProps extends IInputProps {
  name: string;
  control?: Control<any>;
  rules?: TRules;
  onBlur?: () => void;
}

export function ControlledInput(props: IControlledInputProps) {
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
