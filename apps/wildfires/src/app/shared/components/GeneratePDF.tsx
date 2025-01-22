import { MutableRefObject } from "react";
import { useReactToPrint } from "react-to-print";

interface GeneratePDFProps {
  pageRef: MutableRefObject<HTMLDivElement | null>;
  fileName: string | (() => string);
}

const GeneratePDF: React.FC<GeneratePDFProps> = ({ pageRef, fileName }) => {
  const handlePrint = useReactToPrint({
    contentRef: pageRef,
    documentTitle: typeof fileName === "function" ? fileName() : fileName,
    pageStyle: `
      @page {
        size: auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
      }
      .no-page-break {
        page-break-inside: avoid;
      }
    `,
  });

  return (
    <button onClick={handlePrint}>
      Download Page as PDF
    </button>
  );
};

export default GeneratePDF;
