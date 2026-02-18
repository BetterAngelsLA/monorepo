import { memo } from 'react';
import { FormSection } from '../../../../../components/form/FormSection';
import { TextField } from '../../../../../components/form/TextField';
import type { SectionProps } from '../types';

export const BasicInformationSection = memo(function BasicInformationSection({
  data,
  onChange,
  errors,
}: SectionProps) {
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
      <TextField
        id="shelter-organization"
        name="organization"
        label="Organization"
        value={data.organization}
        onChange={(value) => onChange('organization', value)}
        helperText="Select from existing organizations or type to add a new one."
        error={errors.organization}
      />
      <TextField
        id="shelter-location-place"
        name="location-place"
        label="Location (Address)"
        value={data.location?.place ?? ''}
        onChange={(value) =>
          onChange('location', value ? { ...data.location, place: value } : null)
        }
        helperText="Enter the shelter address."
        error={errors.location}
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
