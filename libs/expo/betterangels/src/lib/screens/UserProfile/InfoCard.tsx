import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextMedium } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

export default function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string | undefined;
}) {
  return (
    <View style={styles.infoBox}>
      <TextBold mb="xs">{title}</TextBold>
      <TextMedium>{value}</TextMedium>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    flex: 1,
  },
  infoBox: {
    padding: Spacings.sm,
    borderRadius: 8,
    backgroundColor: Colors.WHITE,
  },
});
