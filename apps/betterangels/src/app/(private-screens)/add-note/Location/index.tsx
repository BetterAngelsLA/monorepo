import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, H5 } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

interface ILocationProps {
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
}

export default function Location(props: ILocationProps) {
  const { expanded, setExpanded } = props;
  const { control, watch } = useFormContext();

  const Location = watch('Location');
  const isLocation = expanded === 'Location';

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isLocation ? undefined : 'Location')}
      title="location"
      actionName={
        !Location && !isLocation ? <H5 size="sm">Add private note</H5> : null
      }
    >
      <MapView
        minZoomLevel={10}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        style={styles.map}
      />
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 100,
    width: '100%',
    marginBottom: Spacings.md,
  },
});
