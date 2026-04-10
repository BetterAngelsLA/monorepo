import { useMutation } from '@apollo/client/react';
import { Button } from '@monorepo/react/components';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Settings2 } from 'lucide-react';
import { FormEvent, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  WizardProgressBar,
  type WizardStep,
} from '../../../../components/layout/WizardProgressBar';
import { useActiveOrg } from '../../../../providers/activeOrg';
import type { ShelterFormData } from '../../formTypes';
import {
  CREATE_SHELTER_MUTATION,
  buildCreateShelterInput,
  type CreateShelterMutationResult,
  type CreateShelterMutationVariables,
} from './api/createShelterMutation';
import {
  validateField,
  validateShelterForm,
  type FormErrors,
} from './constants/validation';
import { useCreateShelterForm } from './hooks/useCreateShelterForm';
import { AdministrationSection } from './sections/AdministrationSection';
import { BasicInformationSection } from './sections/BasicInformationSection';
import { BetterAngelsReviewSection } from './sections/BetterAngelsReviewSection';
import { EcosystemInformationSection } from './sections/EcosystemInformationSection';
import { EntryRequirementsSection } from './sections/EntryRequirementsSection';
import { PoliciesSection } from './sections/PoliciesSection';
import { ServicesOfferedSection } from './sections/ServicesOfferedSection';
import { ShelterDetailsSection } from './sections/ShelterDetailsSection';
import { SleepingDetailsSection } from './sections/SleepingDetailsSection';
import { SummaryInformationSection } from './sections/SummaryInformationSection';

const CREATE_SHELTER_STEPS: WizardStep[] = [
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
  { label: '' },
];

export function CreateShelterForm() {
  const navigate = useNavigate();
  const { activeOrg } = useActiveOrg();
  const selectedOrganizationId = activeOrg?.id ?? '';
  const { formData, updateField, resetForm } = useCreateShelterForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [createShelter, { loading: isSubmitting }] = useMutation<
    CreateShelterMutationResult,
    CreateShelterMutationVariables
  >(CREATE_SHELTER_MUTATION);

  const handleFieldChange = useCallback(
    <K extends keyof ShelterFormData>(field: K, value: ShelterFormData[K]) => {
      updateField(field, value);
      const fieldError = validateField(field, value);
      setErrors((prev) => {
        if (fieldError) {
          return { ...prev, [field]: fieldError };
        }
        if (prev[field]) {
          const { [field]: _omit, ...rest } = prev;
          return rest;
        }
        return prev;
      });
    },
    [updateField]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionError(null);

    if (!selectedOrganizationId) {
      setSubmissionError('Please select an organization.');
      return;
    }

    const validation = validateShelterForm(formData);
    setErrors(validation.errors);
    if (!validation.isValid) {
      return;
    }

    try {
      const { data } = await createShelter({
        variables: {
          data: buildCreateShelterInput(formData, selectedOrganizationId),
        },
        errorPolicy: 'all',
      });

      const result = data?.createShelter;

      if (result?.__typename === 'OperationInfo') {
        const firstMessage = result.messages?.[0]?.message;
        setSubmissionError(
          firstMessage || 'Unable to submit shelter. Please try again.'
        );
        return;
      }

      resetForm();
      setErrors({});
      navigate('/operator');
    } catch {
      setSubmissionError('A network error occurred. Please try again.');
    }
  };

  const handleNextStep = () => {
    setCurrentStep((prev) =>
      Math.min(prev + 1, CREATE_SHELTER_STEPS.length - 1)
    );
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInformationSection
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 1:
        return (
          <SummaryInformationSection
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <SleepingDetailsSection
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 3:
        return (
          <ShelterDetailsSection
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 4:
        return (
          <PoliciesSection
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 5:
        return (
          <ServicesOfferedSection
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 6:
        return (
          <EntryRequirementsSection
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 7:
        return (
          <EcosystemInformationSection
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 8:
      default:
        return (
          <>
            <BetterAngelsReviewSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
            />
            <AdministrationSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
            />
          </>
        );
    }
  };

  const isLastStep = currentStep === CREATE_SHELTER_STEPS.length - 1;

  return (
    <APIProvider
      apiKey={import.meta.env.VITE_SHELTER_GOOGLE_MAPS_API_KEY as string}
    >
      <div className="min-h-screen bg-[#ececec] px-3 py-6 md:px-6">
        <div className="mx-auto w-full max-w-6xl border border-[#d9d9d9] bg-white p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between border-b border-[#efefef] pb-4">
            <div className="text-base text-gray-800">
              <span className="font-medium">
                {activeOrg?.name ?? 'Organization'}
              </span>
              <span className="px-2 text-gray-400">/</span>
              <span className="font-semibold">Shelter Creation</span>
            </div>
            <Link
              to="/operator"
              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
              aria-label="Back to Dashboard"
            >
              <Settings2 size={16} />
            </Link>
          </div>

          <div className="mb-4 w-full max-w-2xl">
            <WizardProgressBar
              steps={CREATE_SHELTER_STEPS}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />
          </div>

          {submissionError ? (
            <div
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {submissionError}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            data-testid="create-shelter-form"
          >
            {renderCurrentStep()}

            <div className="flex items-center justify-between gap-4">
              {currentStep > 0 ? (
                <Button
                  size="xl"
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={isSubmitting}
                  className="h-auto! border border-gray-300! bg-white! px-6 py-2.5 text-gray-700! hover:bg-gray-50! disabled:opacity-50"
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              {!isLastStep ? (
                <Button
                  size="xl"
                  type="button"
                  onClick={handleNextStep}
                  className="h-auto! border border-gray-200! bg-[#f5f7fb]! px-5 py-2.5 text-gray-700! hover:bg-[#ebeff7]!"
                >
                  Next
                </Button>
              ) : (
                <Button
                  size="xl"
                  type="submit"
                  className="h-auto! bg-green-600! px-6 py-2.5 text-white! hover:bg-green-700! transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : 'Create Shelter'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </APIProvider>
  );
}
