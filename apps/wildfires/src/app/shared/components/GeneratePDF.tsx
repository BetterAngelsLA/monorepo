import html2pdf from 'html2pdf.js';
import { Button } from './button/Button';

interface GeneratePDFProps {
  fileName: string | (() => string);
  className?: string;
}

const GeneratePDF: React.FC<GeneratePDFProps> = ({ className }) => {
  const options = {
    margin: [5, 10],
    filename: 'your-wildfire-recovery-action-plan.pdf',
    html2canvas: {
      scale: 2,
      letterRendering: true,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'css' },
  };

  const handleGeneratePdf = () => {
    const h1 = document.createElement('h1');
    h1.textContent = 'Your Wildfire Recovery Action Plan';
    h1.classList.add(
      'font-bold',
      'border-l-[10px]',
      'pl-4',
      'md:pl-8',
      'border-brand-yellow',
      'text-4xl',
      'text-brand-dark-blue',
      'leading-normal'
    );

    h1.setAttribute('data-inserted', 'true');

    window.dispatchEvent(new Event('beforeprint'));

    const element = document.getElementById('content-to-pdf');
    if (element) {
      element.insertBefore(h1, element.firstChild);

      html2pdf()
        .from(element)
        .set(options)
        .save()
        .finally(() => {
          // Dispatch `afterprint` to restore the original collapsed state
          window.dispatchEvent(new Event('afterprint'));
          const h1 = document.querySelector(
            '#content-to-pdf h1[data-inserted="true"]'
          );
          if (h1) {
            h1.remove(); // Remove the <h1> element after PDF generation
          }
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
