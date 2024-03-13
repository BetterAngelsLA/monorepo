import { StyleSheet } from 'react-native';
import { View } from './Themed';

interface SeparatorProps {
  
}

const Separator = ({  }: SeparatorProps) => (
  <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
);

const styles = StyleSheet.create({
separator: {
    backgroundColor: '#ccc',
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});

export default Separator;