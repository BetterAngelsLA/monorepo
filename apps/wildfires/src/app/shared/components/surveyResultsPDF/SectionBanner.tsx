import { StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: { borderLeftWidth: 2, paddingLeft: 8, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold" },
});

export function SectionBanner({ title }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
