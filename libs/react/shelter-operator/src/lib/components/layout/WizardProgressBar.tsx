import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../base-ui/buttons';

export interface WizardStep {
  label: string;
}

export interface WizardNavigationButtons {
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  onNext?: () => void | Promise<void>;
  onBack?: () => void | Promise<void>;
  nextDisabled?: boolean;
  backDisabled?: boolean;
}

export interface WizardProgressBarProps {
  steps: WizardStep[];
  currentStep: number;
  navigationButtons?: WizardNavigationButtons;
  onStepClick?: (stepIndex: number) => void;
}

export function useWizardNavigation(stepPaths: string[]) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = stepPaths.findIndex(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + '/')
  );

  const currentStepIndex = currentStep === -1 ? 0 : currentStep;

  return {
    currentStep: currentStepIndex,
    isFirstStep: currentStepIndex <= 0,
    isLastStep: currentStepIndex === stepPaths.length - 1,
    goToNext: () => {
      if (currentStepIndex < stepPaths.length - 1) {
        navigate(stepPaths[currentStepIndex + 1]);
      }
    },
    goToPrev: () => {
      if (currentStepIndex > 0) {
        navigate(stepPaths[currentStepIndex - 1]);
      }
    },
    goToStep: (i: number) => {
      if (i >= 0 && i < stepPaths.length) {
        navigate(stepPaths[i]);
      }
    },
  };
}

export const WizardProgressBar = memo(
  ({
    steps,
    currentStep,
    navigationButtons,
    onStepClick,
  }: WizardProgressBarProps) => {
    const getStepState = (
      index: number
    ): 'completed' | 'active' | 'upcoming' => {
      if (index < currentStep) return 'completed';
      if (index === currentStep) return 'active';
      return 'upcoming';
    };

    const isLastStep = currentStep === steps.length - 1;

    const handleBack = async () => {
      if (navigationButtons?.onBack) {
        await navigationButtons.onBack();
      }
    };

    const handleNext = async () => {
      if (navigationButtons?.onNext) {
        await navigationButtons.onNext();
      }
    };

    const handleStepClick = (index: number) => {
      const state = getStepState(index);
      if (state === 'completed' && onStepClick) {
        onStepClick(index);
      }
    };

    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-1 py-2">
          <div className="flex items-center w-full">
            {steps.map((_, index) => {
              const state = getStepState(index);
              const isLast = index === steps.length - 1;
              const isClickable = state === 'completed';

              const dotClasses = [
                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300',
                isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default',
                state === 'completed' ? 'bg-[#008CEE] border-[#008CEE]' : 'bg-white',
                state === 'active' ? 'border-[#008CEE]' : '',
                state === 'upcoming' ? 'border-[#e5e7eb]' : '',
              ].filter(Boolean).join(' ');

              const progressBarClasses = [
                'absolute inset-y-0 left-0 rounded-full transition-all duration-500 bg-[#008CEE]',
                index < currentStep ? 'w-full' : 'w-0',
              ].join(' ');

              return (
                <div
                  key={index}
                  className={`flex items-center ${!isLast ? 'flex-1' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={dotClasses}
                    aria-label={`Go to step ${index + 1}`}
                  >
                    {state === 'completed' ? (
                      <Check size={10} strokeWidth={3} color="#ffffff" />
                    ) : null}
                  </button>

                  {!isLast && (
                    <div className="flex-1 h-[2px] relative min-w-0">
                      <div className="absolute inset-0 rounded-full bg-[#e5e7eb]" />
                      <div className={progressBarClasses} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex w-full">
            {steps.map((step, index) => {
              const state = getStepState(index);
              const isLast = index === steps.length - 1;

              const labelClasses = [
                'text-xs transition-colors duration-300',
                !isLast ? 'flex-1' : '',
                state === 'completed' || state === 'active' ? 'text-[#008CEE]' : 'text-gray-400',
              ].join(' ');

              return (
                <div key={index} className={labelClasses}>
                  {step.label}
                </div>
              );
            })}
          </div>
        </div>

        {navigationButtons &&
          (navigationButtons.showBack || navigationButtons.showNext) && (
            <div className="flex justify-between items-center gap-4">
              <div>
                {navigationButtons.showBack && (
                  <Button
                    variant="small-light"
                    onClick={handleBack}
                    disabled={navigationButtons.backDisabled}
                    leftIcon={<ChevronLeft size={16} />}
                    rightIcon={false}
                    className="!text-sm !py-1.5 !px-3 !gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {navigationButtons.backLabel || 'Back'}
                  </Button>
                )}
              </div>
              <div>
                {navigationButtons.showNext && (
                  <Button
                    variant="floating-light"
                    onClick={handleNext}
                    disabled={navigationButtons.nextDisabled}
                    leftIcon={false}
                    rightIcon={<ChevronRight size={16} />}
                    className="!text-sm !py-1.5 !px-4 !gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {navigationButtons.nextLabel ||
                      (isLastStep ? 'Submit' : 'Next')}
                  </Button>
                )}
              </div>
            </div>
          )}
      </div>
    );
  }
);
