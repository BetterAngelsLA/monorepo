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
      <div className="text-sm text-gray-600 mt-3 max-w-md text-center">
        <p className="mb-3">
          If you'd like to save as a PDF, after clicking "Print your action
          plan":
        </p>
        <div className="space-y-2">
          <p>
            Desktop: Select <strong>"Save as PDF"</strong> in the print dialog
          </p>
          <p>
            Mobile: Tap <strong>"Share"</strong> then{' '}
            <strong>"Save to Files"</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneratePDF;
