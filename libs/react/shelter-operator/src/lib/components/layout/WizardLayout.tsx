import {
  FieldValues,
  FormProvider,
  UseFormReturn,
  useForm,
} from 'react-hook-form';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { WizardNavigation } from './WizardNavigation';
import { WizardProgressBar, type WizardStep } from './WizardProgressBar';

export interface WizardNavigationConfig {
  showNavigation?: boolean;
  nextLabel?: string;
  backLabel?: string;
  onNext?: () => void | Promise<void>;
  onBack?: () => void | Promise<void>;
  nextDisabled?: boolean;
  backDisabled?: boolean;
}

export interface WizardLayoutProps<T extends FieldValues = FieldValues> {
  steps: WizardStep[];
  stepPaths: string[];
  methods?: UseFormReturn<T>;
  navigationConfig?: WizardNavigationConfig;
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

export function WizardLayout<T extends FieldValues = FieldValues>({
  steps,
  stepPaths,
  methods: providedMethods,
  navigationConfig,
}: WizardLayoutProps<T>) {
  const defaultMethods = useForm<T>();
  const methods = providedMethods ?? defaultMethods;
  const navigation = useWizardNavigation(stepPaths);

  return (
    <FormProvider {...methods}>
      <div className="w-full flex flex-col items-center flex-1">
        <div className="w-full flex justify-center py-2 px-8">
          <div className="w-full max-w-4xl">
            <WizardProgressBar
              steps={steps}
              currentStep={navigation.currentStep}
              onStepClick={navigation.goToStep}
            />
          </div>
        </div>
        <div className="w-full flex-1 px-8 py-6">
          <Outlet />
        </div>
        {navigationConfig?.showNavigation && (
          <div className="w-full flex justify-end px-8 py-6">
            <WizardNavigation
              showBack={!navigation.isFirstStep}
              showNext={!navigation.isLastStep}
              onBack={navigationConfig.onBack || navigation.goToPrev}
              onNext={async () => {
                const isValid = await methods.trigger();
                if (isValid) {
                  if (navigationConfig.onNext) {
                    await navigationConfig.onNext();
                  } else {
                    navigation.goToNext();
                  }
                }
              }}
              nextLabel={navigationConfig.nextLabel}
              backLabel={navigationConfig.backLabel}
              nextDisabled={navigationConfig.nextDisabled}
              backDisabled={navigationConfig.backDisabled}
              isLastStep={navigation.isLastStep}
            />
          </div>
        )}
      </div>
    </FormProvider>
  );
}
