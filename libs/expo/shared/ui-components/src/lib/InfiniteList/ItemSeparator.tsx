import { View } from 'react-native';

type TProps = {
  height: number;
};

export function ItemSeparator(props: TProps) {
  const { height } = props;

  return <View style={{ height }} />;
}
