import { Document, Page, StyleSheet, Text } from "@react-pdf/renderer";
import { fetchAllAlertsAndResourcesByTagsFn } from "../../clients/sanityCms/queries/fetchAllAlertsAndResourcesByTagsFn";
import { SurveyResources } from "./SurveyResources";

const styles = StyleSheet.create({
  container: { padding: 20 },
  errorText: { color: "red", marginBottom: 10 },
});

export function SurveyResultsPDF({ results }) {
  const { answers = [] } = results;
  const queryTags = getTags(answers);

  // Mocked data (you cannot directly use `react-query` in PDF components)
  const data = fetchAllAlertsAndResourcesByTagsFn(queryTags);

  return (
    <Document>
      <Page size="A4" style={styles.container}>
        {data.length ? (
          <SurveyResources resources={data} />
        ) : (
          <Text style={styles.errorText}>No resources found.</Text>
        )}
      </Page>
    </Document>
  );
}
