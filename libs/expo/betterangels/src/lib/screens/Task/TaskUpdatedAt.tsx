import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { formatScalarDate } from '@monorepo/shared/scalars';
import { StyleSheet, View } from 'react-native';

type TTaskUpdatedAtProps = {
  updatedAt: string;
};

export default function TaskUpdatedAt(props: TTaskUpdatedAtProps) {
  const { updatedAt } = props;
  return (
    <View style={styles.container}>
      <TextRegular size="sm">Updated at</TextRegular>
      <TextBold size="xs">{formatScalarDate(updatedAt, 'MM/dd/yyyy')}</TextBold>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
