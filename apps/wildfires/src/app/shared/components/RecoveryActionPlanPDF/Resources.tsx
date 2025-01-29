import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { useAtom } from 'jotai';
import {
  alertResourcesAtom,
  baseResourcesGroupedSortedAtom,
} from '../../atoms/resourcesAtom';
import { AlertResources } from './AlertResources';
import { ResourceGroupCard } from './ResourceGroupCard';

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

export const Resources = () => {
  const [alertResources] = useAtom(alertResourcesAtom);
  const [baseResourcesGroupedSorted] = useAtom(baseResourcesGroupedSortedAtom);

  return (
    <View>
      <Text style={styles.heading}>Recources</Text>

      {!!baseResourcesGroupedSorted.length && (
        <View>
          {baseResourcesGroupedSorted.map((categoryResources) => {
            const { category, resources } = categoryResources;

            return (
              <ResourceGroupCard
                key={category.slug}
                resourceCategory={category.name}
                resources={resources}
              />
            );
          })}
        </View>
      )}
      {!!alertResources.length && (
        <View style={{ marginTop: 48 }}>
          <AlertResources alerts={alertResources} />
        </View>
      )}
    </View>
  );
};
