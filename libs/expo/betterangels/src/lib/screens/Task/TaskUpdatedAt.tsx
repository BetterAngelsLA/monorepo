import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { StyleSheet, View } from 'react-native';

type TTaskSummaryUpdatedAtProps = {
  updatedAt: string;
};

export default function TaskUpdatedAt(props: TTaskSummaryUpdatedAtProps) {
  const { updatedAt } = props;
  return (
    <View style={styles.container}>
      <TextRegular size="sm">Updated at</TextRegular>
      <TextBold size="xs">{format(new Date(updatedAt), 'MM/dd/yyyy')}</TextBold>
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
