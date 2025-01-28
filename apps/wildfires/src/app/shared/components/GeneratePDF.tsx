import { Document, Page, PDFDownloadLink, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { Button } from './button/Button';

interface GeneratePDFProps {
  fileName: string | (() => string);
  className?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d3b66', // Dark blue
    borderLeftWidth: 10,
    borderLeftColor: '#ffc107', // Yellow
    paddingLeft: 10,
    marginBottom: 10,
  },
  content: {
    fontSize: 12,
    marginTop: 10,
  },
});

const PDFContent = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Your Wildfire Recovery Action Plan</Text>
      <View style={styles.content}>
        <Text>This is where your action plan content goes.</Text>
        <Text>Make sure to dynamically insert your data here as needed.</Text>
      </View>
    </Page>
  </Document>
);

const GeneratePDF: React.FC<GeneratePDFProps> = ({ className, fileName = 'wildfire-recovery-action-plan.pdf' }) => {
  return (
    <PDFDownloadLink
      document={<PDFContent />}
      fileName={typeof fileName === 'function' ? fileName() : fileName}
    >
      {({ loading }) => (
        <Button
          ariaLabel="Save your action plan as a PDF file"
          className={className}
        >
          {loading ? 'Generating PDF...' : 'Save Your Action Plan as a PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default GeneratePDF;
