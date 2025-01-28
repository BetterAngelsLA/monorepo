import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { sortByPriority } from "../../utils/sort"; // Replace with actual sorting logic
import { ResourceCard } from "./ResourceCard"; // Convert ResourceCard to PDF-compatible as well

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    backgroundColor: "#FFFEE0",
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  header: {
    textTransform: "uppercase",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resourceCard: {
    marginBottom: 10,
  },
});

export function AlertResources({ alerts }) {
  if (!alerts?.length) return null;

  const sortedAlerts = sortByPriority(alerts, "priority"); // Ensure this function works with your data

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Alerts</Text>
      {sortedAlerts.map((alert) => (
        <ResourceCard
          key={alert.slug}
          resource={alert}
          style={styles.resourceCard}
        />
      ))}
    </View>
  );
}
