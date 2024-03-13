import { View, Text, StyleSheet } from 'react-native';
import Badge from './Badge';

interface BadgeRowProps {
    badges: string[];
    title?: string;
  }

const BadgeRow = ({ badges, title }: BadgeRowProps) => (
  <View style={styles.container}>
    {title && <Text style={styles.title}>{title}</Text>} 

    <View style={styles.badgesContainer}>
      {badges.map((badge, index) => (
        <Badge key={index} title={badge} />
      ))}
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
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default BadgeRow;