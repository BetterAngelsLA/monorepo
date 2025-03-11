import { Colors } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { ReactNode, isValidElement } from 'react';

type TProps = {
  placeholder?: string | ReactNode | null;
};

export function EmptyState(props: TProps) {
  const { placeholder } = props;

  if (placeholder === null) {
    return null;
  }

  if (isValidElement(placeholder)) {
    return placeholder;
  }

  const value = placeholder || 'Not Provided';

  return (
    <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
      {value}
    </TextBold>
  );
}
