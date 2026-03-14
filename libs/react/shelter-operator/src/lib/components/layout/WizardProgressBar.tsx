import { Check } from 'lucide-react';
import { memo } from 'react';

export interface WizardStep {
  label: string;
}

export interface WizardProgressBarProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export const WizardProgressBar = memo(
  ({ steps, currentStep, onStepClick }: WizardProgressBarProps) => {
    const getStepState = (
      index: number
    ): 'completed' | 'active' | 'upcoming' => {
      if (index < currentStep) return 'completed';
      if (index === currentStep) return 'active';
      return 'upcoming';
    };

    const handleStepClick = (index: number) => {
      const state = getStepState(index);
      if (state === 'completed' && onStepClick) {
        onStepClick(index);
      }
    };

    return (
      <div className="w-full flex flex-col gap-1 py-2">
        <div className="flex items-center w-full">
          {steps.map((_, index) => {
            const state = getStepState(index);
            const isLast = index === steps.length - 1;
            const isClickable = state === 'completed';

            const dotClasses = [
              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300',
              isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default',
              state === 'completed'
                ? 'bg-[#008CEE] border-[#008CEE]'
                : 'bg-white',
              state === 'active' ? 'border-[#008CEE]' : '',
              state === 'upcoming' ? 'border-[#e5e7eb]' : '',
            ]
              .filter(Boolean)
              .join(' ');

            const progressBarClasses = [
              'absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 bg-[#008CEE]',
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
                    <Check size={10} strokeWidth={3} className="text-white" />
                  ) : null}
                </button>

                {!isLast && (
                  <div className="flex-1 h-[2px] relative min-w-0">
                    <div className="absolute top-0 right-0 bottom-0 left-0 rounded-full bg-[#e5e7eb]" />
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
              state === 'completed' || state === 'active'
                ? 'text-[#008CEE]'
                : 'text-gray-400',
            ].join(' ');

            return (
              <div key={index} className={labelClasses}>
                {step.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
