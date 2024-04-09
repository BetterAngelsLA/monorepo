import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';

interface BadgeProps {
  title: string;
}

const Badge = ({ title }: BadgeProps) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 3,
    marginRight: 3,
    marginBottom: 3,
  },
  badgeText: {
    fontSize: 12,
  },
});

export default Badge;
