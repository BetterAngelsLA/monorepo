import { Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

type TProps = {
  label: string;
  value?: string;
};

export function AppDataCard(props: TProps) {
  const { label, value } = props;

  return (
    <View style={styles.container}>
      <TextRegular>{label}</TextRegular>

      {value && <TextBold>{value}</TextBold>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacings.sm,
  },
});
