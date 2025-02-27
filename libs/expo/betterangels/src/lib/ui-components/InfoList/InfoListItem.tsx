import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { ReactNode, isValidElement } from 'react';
import { View, ViewStyle } from 'react-native';
import { InfoListItemPlaceholder } from './InfoListItemPlaceholder';

export type TInfoListItem = {
  content?: string | ReactNode | null;
  title?: string;
  placeholder?: string | ReactNode | null;
  style?: ViewStyle;
  color?: string;
};

export function InfoListItem(props: TInfoListItem) {
  const {
    content,
    placeholder,
    style,
    title,
    color = Colors.PRIMARY_EXTRA_DARK,
  } = props;

  return (
    <View style={style}>
      {!!title && (
        <TextRegular size="sm" mb="xs" color={color}>
          {title}
        </TextRegular>
      )}

      {!!content && !isValidElement(content) && (
        <TextBold size="sm" color={color}>
          {content}
        </TextBold>
      )}

      {!!content && isValidElement(content) && content}

      {!content && <InfoListItemPlaceholder placeholder={placeholder} />}
    </View>
  );
}
