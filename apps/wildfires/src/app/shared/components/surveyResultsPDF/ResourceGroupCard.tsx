import { StyleSheet, View } from "@react-pdf/renderer";
import { ResourceCard } from "./ResourceCard";
import { SectionBanner } from "./SectionBanner";

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
});

export function ResourceGroupCard({ resourceCategory, resources }) {
  if (!resources?.length) return null;

  return (
    <View style={styles.container}>
      <SectionBanner title={resourceCategory} />
      {resources.map((resource) => (
        <ResourceCard key={resource.slug} resource={resource} />
      ))}
    </View>
  );
}
