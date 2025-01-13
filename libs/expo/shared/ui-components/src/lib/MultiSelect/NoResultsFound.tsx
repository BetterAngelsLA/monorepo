import { StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

const DEFAULT_TITLE = 'no results found';

interface IProps {
  title?: string;
}

export function NoResultsFound(props: IProps) {
  const { title = DEFAULT_TITLE } = props;
  return (
    <View style={styles.container}>
      <TextRegular>{title}</TextRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
