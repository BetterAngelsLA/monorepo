import React from 'react';
import { useReactToPrint } from 'react-to-print';
import { usePrint } from '../providers/PrintProvider';
import { Button } from './button/Button';

interface GeneratePDFProps {
  targetRef: React.RefObject<HTMLElement>;
  fileName?: string;
  className?: string;
}

const GeneratePDF = ({
  targetRef,
  fileName = 'your-wildfire-recovery-action-plan.pdf',
  className,
}: GeneratePDFProps) => {
  const { setPrinting } = usePrint();

  const handlePrint = useReactToPrint({
    contentRef: targetRef,
    documentTitle: fileName,
    preserveAfterPrint: true,
    onBeforePrint: async () => setPrinting(true),
    onAfterPrint: () => setPrinting(false),
  });

  return (
    <div className="flex flex-col items-center mx-auto">
      <Button
        ariaLabel="Print your action plan"
        className={className}
        onClick={(e) => {
          e.preventDefault();
          handlePrint();
        }}
      >
        Print your action plan
      </Button>
      <div className="text-sm text-gray-600 mt-3 max-w-md text-center px-4">
        <p className="mb-2">
          After clicking "Print your action plan", to save as a PDF:
        </p>
        <p className="mb-1.5">
          Desktop: Select <strong>"Save as PDF"</strong> in the print dialog
        </p>
        <p>
          Mobile: Tap <strong>"Share"</strong> then{' '}
          <strong>"Save to Files"</strong>
        </p>
      </div>
    </div>
  );
};

export default GeneratePDF;
