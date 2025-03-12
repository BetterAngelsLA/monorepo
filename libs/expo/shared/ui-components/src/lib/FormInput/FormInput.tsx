import { Control, Controller, RegisterOptions } from 'react-hook-form';
import Input from '../Input_V2';
import { IInputProps } from '../Input_V2/Input';

type TRules = Omit<
  RegisterOptions,
  'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
>;

interface IFormInputProps extends IInputProps {
  name: string;
  control?: Control<any>;
  rules?: TRules;
  onBlur?: () => void;
}

export function FormInput(props: IFormInputProps) {
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
