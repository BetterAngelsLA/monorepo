import type { TOrganization } from '@monorepo/react/shared';
import { memo } from 'react';
import {
  Dropdown,
  DropdownOption,
} from '../../../../../components/base-ui/dropdown';
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
          <Dropdown
            placeholder="Select an organization"
            options={organizations.map((org) => ({
              label: org.name,
              value: org.id,
            }))}
            value={
              organizations
                .filter((org) => org.id === selectedOrganizationId)
                .map((org) => ({ label: org.name, value: org.id }))[0] ?? null
            }
            onChange={(selected) => {
              const option = selected as DropdownOption | null;
              if (option) onOrganizationChange(String(option.value));
            }}
          />
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
