import { Check } from 'lucide-react';
import { memo } from 'react';

export interface WizardStep {
  label: string;
}

export interface WizardProgressBarProps {
  steps: WizardStep[];
  currentStep: number;
}

export const WizardProgressBar = memo(
  ({ steps, currentStep }: WizardProgressBarProps) => {
    const getStepState = (
      index: number
    ): 'completed' | 'active' | 'upcoming' => {
      if (index < currentStep) return 'completed';
      if (index === currentStep) return 'active';
      return 'upcoming';
    };

    return (
      <div className="w-[732px] flex flex-col gap-2 px-4 py-6">
        <div className="flex items-center w-full">
          {steps.map((_, index) => {
            const state = getStepState(index);
            const isLast = index === steps.length - 1;

            return (
              <div
                key={index}
                className={`flex items-center ${!isLast ? 'flex-1' : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300"
                  style={{
                    backgroundColor:
                      state === 'completed' ? '#008CEE' : '#ffffff',
                    borderColor: state === 'upcoming' ? '#e5e7eb' : '#008CEE',
                  }}
                >
                  {state === 'completed' ? (
                    <Check size={14} strokeWidth={3} color="#ffffff" />
                  ) : null}
                </div>

                {!isLast && (
                  <div
                    className="flex-1 h-[2px] relative"
                    style={{ minWidth: 0 }}
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: '#e5e7eb' }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: index < currentStep ? '100%' : '0%',
                        backgroundColor: '#008CEE',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex w-full mt-2">
          {steps.map((step, index) => {
            const state = getStepState(index);
            const isLast = index === steps.length - 1;

            return (
              <div
                key={index}
                className={[
                  'text-sm transition-colors duration-300',
                  !isLast ? 'flex-1' : '',
                ].join(' ')}
                style={{
                  color:
                    state === 'completed' || state === 'active'
                      ? '#008CEE'
                      : '#9ca3af',
                }}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default WizardProgressBar;
