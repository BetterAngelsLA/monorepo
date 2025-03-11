import { Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { ReactNode, isValidElement } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

export type TProps = {
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  style?: ViewStyle;
};

export function ClientProfileCardHeader(props: TProps) {
  const { style, subtitle, title } = props;

  if (!title && !subtitle) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Title {...props} />

      <SubTitle {...props} />
    </View>
  );
}

function Title(props: TProps) {
  const { title } = props;

  if (!title) {
    return null;
  }

  if (isValidElement(title)) {
    return title;
  }

  return <TextBold size="md">{title}</TextBold>;
}

function SubTitle(props: TProps) {
  const { subtitle } = props;

  if (!subtitle) {
    return null;
  }

  if (isValidElement(subtitle)) {
    return subtitle;
  }

  return <TextRegular size="md">{subtitle}</TextRegular>;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacings.sm,
  },
});
