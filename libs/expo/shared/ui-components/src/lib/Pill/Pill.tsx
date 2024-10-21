import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

interface IPillProps {
  type?: 'primary' | 'success';
  label: string;
}

export function Pill(props: IPillProps) {
  const { label, type = 'success' } = props;

  return (
    <View style={[styles.pill, styles[type]]}>
      <TextRegular>{label}</TextRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: Radiuses.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  success: {
    backgroundColor: Colors.SUCCESS_EXTRA_LIGHT,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
  },
  primary: {
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    borderColor: Colors.PRIMARY_DARK,
    borderWidth: 1,
    paddingVertical: Spacings.xxs - 1,
    paddingHorizontal: Spacings.sm - 1,
  },
});
