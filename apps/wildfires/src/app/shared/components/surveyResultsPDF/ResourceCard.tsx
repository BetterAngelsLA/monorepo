import { StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 6,
  },
  link: {
    fontSize: 10,
    color: "#1E90FF",
    textDecoration: "underline",
  },
});

export function ResourceCard({ resource }) {
  const { title, description, link } = resource;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {link && (
        <Text style={styles.link}>Link: {link}</Text> // Display as plain text
      )}
    </View>
  );
}
