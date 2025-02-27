import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { ReactNode, isValidElement } from 'react';
import { View, ViewStyle } from 'react-native';

export type TClientProfileSectionItem = {
  content?: string | ReactNode | null;
  title?: string;
  placeholder?: string | ReactNode | null;
  style?: ViewStyle;
};

export function ClientProfileSectionItem(props: TClientProfileSectionItem) {
  const { content, placeholder, style, title } = props;

  return (
    <View style={style}>
      {!!title && (
        <TextRegular size="sm" mb="xs" color={Colors.PRIMARY_EXTRA_DARK}>
          {title}
        </TextRegular>
      )}

      {!!content && !isValidElement(content) && (
        <TextBold size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
          {content}
        </TextBold>
      )}

      {!!content && isValidElement(content) && <>{content}</>}

      {!content && <Placeholder placeholder={placeholder} />}
    </View>
  );
}

type TPlaceholder = {
  placeholder?: string | ReactNode | null;
};

function Placeholder(props: TPlaceholder) {
  const { placeholder } = props;

  if (placeholder === null) {
    return null;
  }

  if (isValidElement(placeholder)) {
    return <>{placeholder}</>;
  }

  return (
    <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
      Not Provided
    </TextBold>
  );
}
