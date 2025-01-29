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
    onBeforePrint: async () => setPrinting(true),
    onAfterPrint: () => setPrinting(false),
  });

  return (
    <div className="flex flex-col items-center gap-2">
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
    </div>
  );
};

export default GeneratePDF;
