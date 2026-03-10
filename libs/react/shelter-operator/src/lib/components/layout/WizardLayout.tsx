import {
  FieldValues,
  FormProvider,
  UseFormReturn,
  useForm,
} from 'react-hook-form';
import { Outlet, useLocation } from 'react-router-dom';
import { WizardProgressBar, type WizardStep } from './WizardProgressBar';

export interface WizardLayoutProps<T extends FieldValues = FieldValues> {
  steps: WizardStep[];
  stepPaths: string[];
  methods?: UseFormReturn<T>;
}

export function WizardLayout<T extends FieldValues = FieldValues>({
  steps,
  stepPaths,
  methods: providedMethods,
}: WizardLayoutProps<T>) {
  const location = useLocation();
  const defaultMethods = useForm<T>();
  const methods = providedMethods ?? defaultMethods;

  const currentStep = stepPaths.findIndex((path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  });

  return (
    <FormProvider {...methods}>
      <div className="w-full  flex flex-col items-center min-h-screen bg-white">
        <div className="w-full max-w-2xl">
          <WizardProgressBar
            steps={steps}
            currentStep={currentStep === -1 ? 0 : currentStep}
          />
        </div>
        <div className="w-full flex-1 px-8 py-6">
          <Outlet />
        </div>
      </div>
    </FormProvider>
  );
}
