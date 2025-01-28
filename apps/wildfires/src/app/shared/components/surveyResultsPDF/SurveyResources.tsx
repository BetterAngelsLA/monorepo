import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { AlertResources } from "./AlertResources";
import { ResourceGroupCard } from "./ResourceGroupCard";

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
});

export function SurveyResources({ resources }) {
  const baseResources = resources.filter((r) => r.resourceType === "resource");
  const alertResources = resources.filter((r) => r.resourceType === "alert");

  const baseResourcesGroupedSorted = groupResources(baseResources);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Resources</Text>
      {baseResourcesGroupedSorted.map((group) => (
        <ResourceGroupCard key={group.category.slug} {...group} />
      ))}
      {!!alertResources.length && <AlertResources alerts={alertResources} />}
    </View>
  );
}
