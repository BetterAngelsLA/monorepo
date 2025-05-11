import { View } from 'react-native';
import { BaMap, TGeoPoint } from '../../ui-components';

export default function Cluster() {
  // const [selectedItems, setSelectedItems] = useState<TMapFeature[]>([]);

  function onSelectedChange(items: TGeoPoint[]) {
    console.log();
    console.log('| -------------  onSelectedChange  ------------- |');
    items.map((i) => console.log(i));
    console.log();
  }

  return (
    <View>
      <BaMap onSelectedChange={onSelectedChange} />
    </View>
  );
}
