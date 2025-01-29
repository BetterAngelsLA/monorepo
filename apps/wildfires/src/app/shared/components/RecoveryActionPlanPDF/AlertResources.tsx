import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { TResource } from '../../clients/sanityCms/types';
import { sortByPriority } from '../../utils/sort';
import { ResourceCard } from './ResourceCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFEE0',
    paddingVertical: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  alert: {
    textTransform: 'uppercase',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 40,
  },
});

type IProps = {
  alerts?: TResource[];
};

export const AlertResources = (props: IProps) => {
  const { alerts } = props;

  if (!alerts?.length) {
    return null;
  }

  const sortedAlerts = sortByPriority<TResource>(alerts, 'priority');

  return (
    <View style={styles.container}>
      <Text style={styles.alert}>alerts</Text>

      {sortedAlerts.map((alert) => (
        <ResourceCard key={alert.slug} resource={alert} />
      ))}
    </View>
  );
};
