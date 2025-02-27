import { Colors } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { ReactNode, isValidElement } from 'react';

type TPlaceholder = {
  placeholder?: string | ReactNode | null;
};

export function InfoListItemPlaceholder(props: TPlaceholder) {
  const { placeholder } = props;

  if (placeholder === null) {
    return null;
  }

  if (isValidElement(placeholder)) {
    return placeholder;
  }

  return (
    <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
      Not Provided
    </TextBold>
  );
}
