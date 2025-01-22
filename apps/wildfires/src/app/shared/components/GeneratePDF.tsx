import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { MutableRefObject } from "react";

interface GeneratePDFProps {
  pageRef: MutableRefObject<HTMLDivElement | null>;
  fileName: string | (() => string);
}

const GeneratePDF: React.FC<GeneratePDFProps> = ({ pageRef, fileName }) => {
  const downloadPDF = async () => {
    const element = pageRef.current;

    if (!element) {
      console.error("Page reference is null. Cannot generate PDF.");
      return;
    }

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(image, "PNG", 0, 0, pdfWidth, pdfHeight);

      const resolvedFileName =
        typeof fileName === "function" ? fileName() : fileName;

      pdf.save(resolvedFileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return <button onClick={downloadPDF}>Download Page as PDF</button>;
};

export default GeneratePDF;
