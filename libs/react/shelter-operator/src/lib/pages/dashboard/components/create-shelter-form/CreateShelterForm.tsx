import { useMutation } from '@apollo/client/react';
import { Button } from '@monorepo/react/components';
import { APIProvider } from '@vis.gl/react-google-maps';
import { ChevronRight } from 'lucide-react';
import { FormEvent, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      <div className="min-h-screen bg-white px-4 py-6 md:px-6 md:py-8">
        <div className="px-6 pt-5 md:px-8">
          <WizardProgressBar
            steps={CREATE_SHELTER_STEPS}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        {submissionError ? (
          <div
            className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 md:mx-8"
            role="alert"
          >
            {submissionError}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-10 px-6 pb-8 pt-4 md:px-8"
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
                className="h-auto! rounded-full! bg-[#3b82f6]! px-6 py-2.5 text-white! hover:bg-[#2f74e8]!"
              >
                <span className="inline-flex items-center gap-2">
                  Save and Continue
                  <ChevronRight size={16} />
                </span>
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
    </APIProvider>
  );
}
