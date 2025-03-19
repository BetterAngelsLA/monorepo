import { Colors } from '@monorepo/expo/shared/static';
import TextRegular from '../TextRegular';

interface IFormFieldErrorProps {
  message: string;
}

export function FormFieldError(props: IFormFieldErrorProps) {
  const { message } = props;
  return (
    <TextRegular mt="xxs" size="sm" color={Colors.ERROR}>
      {message}
    </TextRegular>
  );
}
