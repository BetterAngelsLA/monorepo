import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { ReactNode, isValidElement } from 'react';
import { View, ViewStyle } from 'react-native';
import { InfoListItemPlaceholder } from './InfoListItemPlaceholder';

export type TInfoListItem = {
  content?: string | ReactNode | null;
  title?: string | ReactNode | null;
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
      <Title title={title} color={color} />

      <Content content={content} color={color} placeholder={placeholder} />
    </View>
  );
}

type TTitle = {
  title?: string | ReactNode | null;
  color?: string;
};

function Title(props: TTitle) {
  const { title, color } = props;

  if (!title) {
    return null;
  }

  if (isValidElement(title)) {
    return title;
  }

  return (
    <TextRegular size="sm" mb="xs" color={color}>
      {title}
    </TextRegular>
  );
}

type TContent = {
  content?: string | ReactNode | null;
  placeholder?: string | ReactNode | null;
  color?: string;
};

function Content(props: TContent) {
  const { content, placeholder, color = Colors.PRIMARY_EXTRA_DARK } = props;

  if (!content) {
    return <InfoListItemPlaceholder placeholder={placeholder} />;
  }

  if (isValidElement(content)) {
    return content;
  }

  return (
    <TextBold size="sm" color={color}>
      {content}
    </TextBold>
  );
}
