import { FormEvent, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreateShelterForm } from './hooks/useCreateShelterForm';
import { validateField, validateShelterForm, type FormErrors } from './constants/validation';
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
import type { ShelterFormData } from '../../types';

export default function CreateShelterForm() {
  const { formData, updateField } = useCreateShelterForm();
  const [errors, setErrors] = useState<FormErrors>({});

  const handleFieldChange = useCallback(
    <K extends keyof ShelterFormData>(field: K, value: ShelterFormData[K]) => {
      updateField(field, value);
      const fieldError = validateField(field, value);
      setErrors(prev => {
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateShelterForm(formData);
    setErrors(validation.errors);
    if (!validation.isValid) {
      return;
    }
    // TODO: Replace with GraphQL mutation once API is ready.
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
        <h1 className="text-3xl font-semibold text-gray-900">Create New Shelter</h1>
        <p className="mt-2 text-sm text-gray-600">
          Provide as much detail as possible to ensure accurate shelter listings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" data-testid="create-shelter-form">
        <BasicInformationSection data={formData} onChange={handleFieldChange} errors={errors} />
        <SummaryInformationSection data={formData} onChange={handleFieldChange} errors={errors} />
        <SleepingDetailsSection data={formData} onChange={handleFieldChange} errors={errors} />
        <ShelterDetailsSection data={formData} onChange={handleFieldChange} errors={errors} />
        <PoliciesSection data={formData} onChange={handleFieldChange} errors={errors} />
        <ServicesOfferedSection data={formData} onChange={handleFieldChange} errors={errors} />
        <EntryRequirementsSection data={formData} onChange={handleFieldChange} errors={errors} />
        <EcosystemInformationSection data={formData} onChange={handleFieldChange} errors={errors} />
        <BetterAngelsReviewSection data={formData} onChange={handleFieldChange} errors={errors} />
        <AdministrationSection data={formData} onChange={handleFieldChange} errors={errors} />
        <MediaSection data={formData} onChange={handleFieldChange} errors={errors} />

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-700 transition-colors"
          >
            Create Shelter
          </button>
        </div>
      </form>
    </div>
  );
}
