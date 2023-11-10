import { StyleSheet, Text, View } from 'react-native';

export default function AppointmentScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointment screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
