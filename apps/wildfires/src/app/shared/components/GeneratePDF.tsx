import html2pdf from 'html2pdf.js';
import { Button } from './button/Button';

interface GeneratePDFProps {
  fileName: string | (() => string);
  className?: string;
}

const GeneratePDF: React.FC<GeneratePDFProps> = ({ className }) => {
  const options = {
    margin: [5, 10],
    filename: 'result-content.pdf',
    html2canvas: {
      scale: 2,
      letterRendering: true,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'css' },
  };

  const handleGeneratePdf = () => {
    // Dispatch `beforeprint` to expand all collapsible sections
    window.dispatchEvent(new Event('beforeprint'));

    const element = document.getElementById('content-to-pdf');
    if (element) {
      html2pdf()
        .from(element)
        .set(options)
        .save()
        .finally(() => {
          // Dispatch `afterprint` to restore the original collapsed state
          window.dispatchEvent(new Event('afterprint'));
        });
    }
  };

  return (
    <Button
      ariaLabel="Save your action plan as a PDF file"
      className={className}
      onClick={handleGeneratePdf}
    >
      Save Your Action Plan as a PDF
    </Button>
  );
};

export default GeneratePDF;
