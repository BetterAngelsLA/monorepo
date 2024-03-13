import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';

interface DescriptionProps {
    text: string;
    title?: string;
  }

const Description = ({ text, title }: DescriptionProps) => (
  <View style={styles.container}>
    {title && <Text style={styles.title}>{title}</Text>}
    <View style={styles.textContainer}>
        <Text style={styles.description}>{text}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
  },
  textContainer: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
  },
});

export default Description;