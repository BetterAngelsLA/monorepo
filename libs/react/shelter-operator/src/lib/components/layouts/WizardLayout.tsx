import { FormProvider, useForm } from 'react-hook-form';
import { Outlet, useLocation } from 'react-router-dom';
import { WizardProgressBar, type WizardStep } from './WizardProgressBar';

export interface WizardLayoutProps {
  steps: WizardStep[];
  stepPaths: string[];
}

export function WizardLayout({ steps, stepPaths }: WizardLayoutProps) {
  const location = useLocation();
  const methods = useForm();

  const currentStep = stepPaths.findIndex((path) => {
    const segments = location.pathname.split('/');
    return segments.includes(path);
  });

  return (
    <FormProvider {...methods}>
      <div className="w-full  flex flex-col items-center min-h-screen bg-white">
        <div className="w-full flex justify-center py-2 px-8">
          <div className="w-full max-w-2xl">
            <WizardProgressBar
              steps={steps}
              currentStep={currentStep === -1 ? 0 : currentStep}
            />
          </div>
        </div>
        <div className="w-full flex-1 px-8 py-6">
          <Outlet />
        </div>
      </div>
    </FormProvider>
  );
}
