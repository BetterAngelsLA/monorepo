import { memo } from 'react';
import { FormSection } from '../../../../../components/form/FormSection';
import { ScheduleField } from '../../../../../components/form/ScheduleField';
import { TextField } from '../../../../../components/form/TextField';
import { useActiveOrg } from '../../../../../providers/activeOrg';
import { LocationPicker } from '../components/LocationPicker';
import type { SectionProps } from '../types';

export const BasicInformationSection = memo(function BasicInformationSection({
  data,
  onChange,
  errors,
}: SectionProps) {
  const { activeOrg } = useActiveOrg();

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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organization
        </label>
        {activeOrg ? (
          <p className="text-sm text-gray-900">{activeOrg.name}</p>
        ) : (
          <p className="text-sm text-red-600">
            No organization selected. Please select one from the header.
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
      <ScheduleField
        id="shelter-schedules"
        label="Schedules"
        value={data.schedules}
        onChange={(value) => onChange('schedules', value)}
        helperText="Add operating hours, intake hours, and other schedules for each day."
      />
    </FormSection>
  );
});
