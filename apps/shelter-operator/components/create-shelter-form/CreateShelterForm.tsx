import { FormEvent } from 'react';
import { Link } from 'react-router-dom';
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
  const { formData, updateField } = useCreateShelterForm();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInformationSection data={formData} onChange={updateField} />
        <SummaryInformationSection data={formData} onChange={updateField} />
        <SleepingDetailsSection data={formData} onChange={updateField} />
        <ShelterDetailsSection data={formData} onChange={updateField} />
        <PoliciesSection data={formData} onChange={updateField} />
        <ServicesOfferedSection data={formData} onChange={updateField} />
        <EntryRequirementsSection data={formData} onChange={updateField} />
        <EcosystemInformationSection data={formData} onChange={updateField} />
        <BetterAngelsReviewSection data={formData} onChange={updateField} />
        <AdministrationSection data={formData} onChange={updateField} />
        <MediaSection data={formData} onChange={updateField} />

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
