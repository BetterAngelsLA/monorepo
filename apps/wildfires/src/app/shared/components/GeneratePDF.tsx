import html2pdf from 'html2pdf.js';
import { Button } from './button/Button';

interface GeneratePDFProps {
  fileName: string | (() => string);
  className?: string;
}

const GeneratePDF: React.FC<GeneratePDFProps> = ({ className }) => {
  const options = {
    margin: [20, 20],
    filename: 'result-content.pdf',
    html2canvas: { scale: 2, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'avoid-all' },
  };

  const handleGeneratePdf = () => {
    const element = document.getElementById('content-to-pdf');
    if (element) {
      html2pdf(element, options);
    }
  };

  return (
    <Button className={className} onClick={handleGeneratePdf}>
      Save Your Action Plan as a PDF
    </Button>
  );
};

export default GeneratePDF;
