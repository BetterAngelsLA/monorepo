import { FontSizes } from '@monorepo/expo/shared/static';
import { StyleSheet, Text } from 'react-native';

interface IFontProps {
  title: string;
  fontFamily: string;
}

export function Font(props: IFontProps) {
  const { title = 'Save', fontFamily } = props;
  return <Text style={[styles.text, { fontFamily }]}>{title}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: FontSizes.md.fontSize,
    lineHeight: 25,
    letterSpacing: 0.25,
  },
});
