import {
  Document,
  Image,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import React from 'react';
import LOGO from '../../../assets/images/la_disaster_relief_navigator_logo.png';
import { Button } from './button/Button';
import { BestPractices } from './RecoveryActionPlanPDF/BestPractices';

interface GeneratePDFProps {
  fileName: string | (() => string);
  className?: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
  },

  header: {
    backgroundColor: '#375C76',
    height: 104,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  logo: {
    width: 230,
    height: 54,
  },

  wrapper: {
    padding: 20,
  },
  line: {
    height: '100%',
    width: 10,
    backgroundColor: '#ffc107', // Yellow
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d3b66',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#ffffff',
  },
  content: {
    fontSize: 12,
    marginTop: 10,
  },
});

const PDFContent = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src={LOGO} />
      </View>
      <View style={styles.heading}>
        <View style={styles.line} />
        <Text style={styles.title}>Your Wildfire Recovery Action Plan</Text>
      </View>
      <View style={styles.wrapper}>
        <BestPractices />
      </View>
    </Page>
  </Document>
);

const GeneratePDF: React.FC<GeneratePDFProps> = ({
  className,
  fileName = 'wildfire-recovery-action-plan.pdf',
}) => {
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
