import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { TResource } from '../../clients/sanityCms/types';
import { sortByPriority } from '../../utils/sort';
import { ResourceCard } from './ResourceCard';

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 24,
  },
  line: {
    height: '100%',
    width: 10,
    backgroundColor: '#9cdced', // Sky Blue
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    color: '#000',
  },
});

type IProps = {
  resourceCategory: string;
  resources?: TResource[];
};

export const ResourceGroupCard = (props: IProps) => {
  const { resourceCategory, resources } = props;

  if (!resources?.length) {
    return null;
  }

  const sortedResources = sortByPriority<TResource>(resources, 'priority');

  const title = resourceCategory;

  return (
    <View style={{ gap: 16, marginTop: 32 }}>
      {!!title && (
        <View style={styles.titleWrapper}>
          <View style={styles.line} />
          <View>{!!title && <Text style={styles.title}>{title}</Text>}</View>
        </View>
      )}

      {sortedResources.map((resource, index) => (
        <ResourceCard key={index} resource={resource} />
      ))}
    </View>
  );
};
