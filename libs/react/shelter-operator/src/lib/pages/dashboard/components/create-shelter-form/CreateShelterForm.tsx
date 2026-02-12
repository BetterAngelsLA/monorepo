import { useMutation } from '@apollo/client/react';
import { Button } from '@monorepo/react/components';
import { FormEvent, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ShelterFormData } from '../../types';
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
import { MediaSection } from './sections/MediaSection';
import { PoliciesSection } from './sections/PoliciesSection';
import { ServicesOfferedSection } from './sections/ServicesOfferedSection';
import { ShelterDetailsSection } from './sections/ShelterDetailsSection';
import { SleepingDetailsSection } from './sections/SleepingDetailsSection';
import { SummaryInformationSection } from './sections/SummaryInformationSection';

export default function CreateShelterForm() {
  const { formData, updateField, resetForm } = useCreateShelterForm();
  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(
    null
  );
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
          return {
            ...prev,
            [field]: fieldError,
          };
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
    setSubmissionSuccess(null);
    const validation = validateShelterForm(formData);
    setErrors(validation.errors);
    if (!validation.isValid) {
      return;
    }

    try {
      const response = await createShelter({
        variables: {
          input: buildCreateShelterInput(formData),
        },
      });
      console.log(
        'Shelter submission successful',
        response.data?.createShelter
      );
      setSubmissionSuccess('Shelter submitted successfully.');
      resetForm();
      setErrors({});
    } catch (error) {
      console.error('Shelter submission failed', error);
      setSubmissionError(extractApolloError(error));
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/operator/dashboard" className="inline-block">
        <button
          type="button"
          className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </Link>

      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Create New Shelter
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Provide as much detail as possible to ensure accurate shelter
          listings.
        </p>
      </div>

      {submissionError ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {submissionError}
        </div>
      ) : null}
      {submissionSuccess ? (
        <div
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          {submissionSuccess}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        data-testid="create-shelter-form"
      >
        <BasicInformationSection
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
        <SummaryInformationSection
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
        <SleepingDetailsSection
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
        <ShelterDetailsSection
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
        <PoliciesSection
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
        <ServicesOfferedSection
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
        <EntryRequirementsSection
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
        <EcosystemInformationSection
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
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
        <MediaSection
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />

        <div className="flex justify-center">
          <Button
            size="xl"
            type="submit"
            className="!h-auto !bg-green-600 !text-black px-6 py-3 hover:!bg-green-700 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Create Shelter'}
          </Button>
        </div>
      </form>
    </div>
  );
}

const extractApolloError = (error: unknown) => {
  // Check if error has the shape of an Apollo error
  if (error && typeof error === 'object' && 'graphQLErrors' in error) {
    const apolloError = error as {
      graphQLErrors?: Array<{
        message: string;
        extensions?: { errors?: Array<{ messages?: string[] }> };
      }>;
      networkError?: { message?: string } | null;
    };
    const graphQLErrorMessages = apolloError.graphQLErrors
      ?.map((graphQLError) => {
        const formattedErrors = graphQLError.extensions?.['errors'];
        if (Array.isArray(formattedErrors) && formattedErrors.length) {
          const first = formattedErrors[0];
          if (first?.messages?.length) {
            return first.messages.join(', ');
          }
        }
        return graphQLError.message;
      })
      .filter(Boolean);

    if (graphQLErrorMessages && graphQLErrorMessages.length) {
      return graphQLErrorMessages[0] as string;
    }

    if (apolloError.networkError) {
      return 'Network error while submitting shelter. Please try again.';
    }
  }

  return 'Unable to submit shelter. Please try again.';
};
