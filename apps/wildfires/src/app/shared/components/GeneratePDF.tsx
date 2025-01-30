import React, { useCallback } from 'react';
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
    suppressErrors: true,
    preserveAfterPrint: true,
    onAfterPrint: () => {
      setPrinting(false);
    },
  });

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      try {
        setPrinting(true);
        await new Promise((resolve) => {
          setTimeout(() => {
            requestAnimationFrame(resolve);
          }, 100);
        });
        handlePrint();
      } catch (error) {
        console.error('Print failed:', error);
        setPrinting(false);
      }
    },
    [handlePrint, setPrinting]
  );

  return (
    <div className="flex flex-col items-center mx-auto">
      <Button
        ariaLabel="Print Your Action Plan"
        className={className}
        onClick={handleClick}
      >
        Print Your Action Plan
      </Button>
      <div className="text-sm text-gray-600 mt-3 max-w-md text-center px-4">
        <p className="mb-2">
          To save as PDF, click "Print Your Action Plan" above, then:
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
