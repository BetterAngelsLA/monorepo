import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';
import { Button } from '../base-ui/buttons/buttons';

export interface WizardNavigationProps {
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  onNext?: () => void | Promise<void>;
  onBack?: () => void | Promise<void>;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  isLastStep?: boolean;
}

export const WizardNavigation = memo(
  ({
    showBack = true,
    showNext = true,
    nextLabel,
    backLabel,
    onNext,
    onBack,
    nextDisabled = false,
    backDisabled = false,
    isLastStep = false,
  }: WizardNavigationProps) => {
    const handleBack = async () => {
      if (onBack) {
        await onBack();
      }
    };

    const handleNext = async () => {
      if (onNext) {
        await onNext();
      }
    };

    const defaultNextLabel = isLastStep ? 'Submit' : 'Next';

    return (
      <div className="flex items-center gap-3">
        {showBack && (
          <Button
            variant="primary"
            onClick={handleBack}
            disabled={backDisabled}
            leftIcon={<ChevronLeft size={16} />}
            className="!text-sm !py-1.5 !px-3 !gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {backLabel || 'Back'}
          </Button>
        )}
        {showNext && (
          <Button
            variant="floating"
            onClick={handleNext}
            disabled={nextDisabled}
            rightIcon={<ChevronRight size={16} />}
            className="!text-sm !py-1.5 !px-4 !gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextLabel || defaultNextLabel}
          </Button>
        )}
      </div>
    );
  }
);
