import { FormProvider, useForm } from 'react-hook-form';
import { Outlet, useLocation } from 'react-router-dom';
import { useUser } from '@monorepo/react/shelter';
import { OperatorHeader } from '../OperatorHeader';
import { WizardProgressBar, type WizardStep } from './WizardProgressBar';

export interface WizardLayoutProps {
  steps: WizardStep[];
  stepPaths: string[];
  organizationName?: string;
  shelterName?: string;
  pageTitle?: string;
}

export function WizardLayout({
  steps,
  stepPaths,
  organizationName,
  shelterName,
  pageTitle,
}: WizardLayoutProps) {
  const location = useLocation();
  const methods = useForm();
  const { user } = useUser();
  const defaultOrgName = organizationName || user?.organization?.name;

  const currentStep = stepPaths.findIndex((path) => {
    const segments = location.pathname.split('/');
    return segments.includes(path);
  });

  return (
    <FormProvider {...methods}>
      <div className="w-full flex flex-col min-h-screen bg-white">
        <OperatorHeader
          organizationName={defaultOrgName}
          shelterName={shelterName}
          pageTitle={pageTitle}
        />
        <div className="w-full flex flex-col items-center flex-1">
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
      </div>
    </FormProvider>
  );
}
