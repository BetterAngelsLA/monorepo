import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { ReactNode } from 'react';

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    width: '100%',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: 'black',
    marginBottom: 16,
    paddingRight: 24,
  },
});

export const BestPracticesCard = ({
  icon,
  title,
  description,
  bgColor,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  bgColor: string;
}) => (
  <View style={[styles.container, { backgroundColor: bgColor }]}>
    <View style={styles.iconWrapper}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={{ fontSize: 16 }}>{description}</Text>
    </View>
  </View>
);
