import type { TOrganization } from '@monorepo/react/shared';
import { memo } from 'react';
import { FormSection } from '../../../../../components/form/FormSection';
import { TextField } from '../../../../../components/form/TextField';
import { LocationPicker } from '../components/LocationPicker';
import type { SectionProps } from '../types';

interface BasicInformationSectionProps extends SectionProps {
  organizations: TOrganization[];
  selectedOrganizationId: string;
  onOrganizationChange: (id: string) => void;
}

export const BasicInformationSection = memo(function BasicInformationSection({
  data,
  onChange,
  errors,
  organizations,
  selectedOrganizationId,
  onOrganizationChange,
}: BasicInformationSectionProps) {
  return (
    <FormSection title="Basic Information">
      <TextField
        id="shelter-name"
        name="name"
        label="Shelter Name"
        value={data.name}
        onChange={(value) => onChange('name', value)}
        required
        error={errors.name}
      />
      <div>
        <label
          htmlFor="shelter-organization"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Organization
        </label>
        {organizations.length > 0 ? (
          <select
            id="shelter-organization"
            value={selectedOrganizationId}
            onChange={(e) => onOrganizationChange(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select an organization
            </option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-red-600">
            You don't belong to any organizations.
          </p>
        )}
        {errors.organization && (
          <p className="mt-1 text-sm text-red-600">{errors.organization}</p>
        )}
      </div>
      <LocationPicker
        value={data.location}
        onChange={(value) => onChange('location', value)}
        error={errors.location}
        label="Location"
      />
      <TextField
        id="shelter-email"
        name="email"
        label="Email"
        type="email"
        value={data.email}
        onChange={(value) => onChange('email', value)}
        error={errors.email}
      />
      <TextField
        id="shelter-phone"
        name="phone"
        label="Phone"
        type="tel"
        value={data.phone}
        onChange={(value) => onChange('phone', value)}
        error={errors.phone}
      />
      <TextField
        id="shelter-website"
        name="website"
        label="Website"
        type="url"
        value={data.website}
        onChange={(value) => onChange('website', value)}
        error={errors.website}
      />
      <TextField
        id="shelter-instagram"
        name="instagram"
        label="Instagram"
        value={data.instagram}
        onChange={(value) => onChange('instagram', value)}
      />
    </FormSection>
  );
});
