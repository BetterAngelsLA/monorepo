import { Check } from 'lucide-react';
import { memo } from 'react';
import { Button } from '../base-ui/buttons/buttons';

export interface WizardStep {
  label: string;
  pathSegment?: string;
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
      <div className="w-full py-2">
        <div className="flex items-start w-full px-4">
          {steps.map((step, index) => {
            const state = getStepState(index);
            const isLast = index === steps.length - 1;
            const isClickable = state === 'completed';

            const dotClasses = [
              '!size-5 !p-0 border-2 transition-all duration-300',
              isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default',
              state === 'completed'
                ? '!bg-[#008CEE] !border-[#008CEE]'
                : '!bg-white',
              state === 'active' ? '!border-[#008CEE]' : '',
              state === 'upcoming' ? '!border-[#e5e7eb]' : '',
            ]
              .filter(Boolean)
              .join(' ');

            const progressBarClasses = [
              'absolute top-0 bottom-0 left-0 rounded-full bg-[#008CEE]',
              index < currentStep ? 'w-full' : 'w-0',
            ].join(' ');

            const labelClasses = [
              'text-xs transition-colors duration-300 leading-tight text-center w-max max-w-36',
              state === 'completed' || state === 'active'
                ? 'text-[#008CEE]'
                : 'text-gray-400',
            ].join(' ');

            return (
              <div
                key={index}
                className={`relative min-w-0 pb-8 ${!isLast ? 'flex-1' : ''}`}
              >
                <div className="flex items-center">
                  <Button
                    variant="right-arrow"
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={dotClasses}
                    aria-label={`Go to step ${index + 1}`}
                    leftIcon={
                      state === 'completed' ? (
                        <Check
                          size={10}
                          strokeWidth={3}
                          className="text-white"
                        />
                      ) : (
                        false
                      )
                    }
                  />

                  {!isLast && (
                    <div className="flex-1 h-[2px] relative min-w-0">
                      <div className="absolute top-0 right-0 bottom-0 left-0 rounded-full bg-[#e5e7eb]" />
                      <div className={progressBarClasses} />
                    </div>
                  )}
                </div>

                <div className="absolute top-7 left-2.5 -translate-x-1/2">
                  <div className={labelClasses}>{step.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
