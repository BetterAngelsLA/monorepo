import { memo } from 'react';
import { NumberField } from '../../../../../components/form/NumberField';
import { FormSection } from '../../../../../components/form/FormSection';
import { ScheduleField } from '../../../../../components/form/ScheduleField';
import { SelectField } from '../../../../../components/form/SelectField';
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
        placeholder="Enter your shelter name"
        required
        error={errors.name}
      />

      <SelectField<string>
        id="shelter-organization"
        name="organization"
        label="Organization"
        value={activeOrg?.id ?? ''}
        options={
          activeOrg
            ? [{ value: activeOrg.id, label: activeOrg.name }]
            : [{ value: '', label: 'Please select' }]
        }
        onChange={(value) => onChange('organization', value)}
        placeholder="Please select"
        required
        error={errors.organization}
      />

      <LocationPicker
        value={data.location}
        onChange={(value) => onChange('location', value)}
        error={errors.location}
        label="Address"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NumberField
          id="shelter-latitude"
          name="latitude"
          label="Latitude"
          value={data.location?.latitude ?? null}
          step={0.000001}
          onChange={(value) =>
            onChange('location', {
              place: data.location?.place ?? '',
              latitude: value ?? undefined,
              longitude: data.location?.longitude,
            })
          }
        />
        <NumberField
          id="shelter-longitude"
          name="longitude"
          label="Longitude"
          value={data.location?.longitude ?? null}
          step={0.000001}
          onChange={(value) =>
            onChange('location', {
              place: data.location?.place ?? '',
              latitude: data.location?.latitude,
              longitude: value ?? undefined,
            })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id="shelter-email"
          name="email"
          label="Email"
          type="email"
          value={data.email}
          onChange={(value) => onChange('email', value)}
          placeholder="email@gmail.com"
          error={errors.email}
        />
        <TextField
          id="shelter-phone"
          name="phone"
          label="Phone Number"
          type="tel"
          value={data.phone}
          onChange={(value) => onChange('phone', value)}
          placeholder="123-456-7890"
          error={errors.phone}
        />
      </div>

      <TextField
        id="shelter-website"
        name="website"
        label="Website"
        type="url"
        value={data.website}
        onChange={(value) => onChange('website', value)}
        placeholder="Enter your website"
        error={errors.website}
      />

      <TextField
        id="shelter-instagram"
        name="instagram"
        label="Instagram"
        value={data.instagram}
        onChange={(value) => onChange('instagram', value)}
        placeholder="Enter your username"
      />

      <ScheduleField
        id="shelter-schedules"
        label="Operating Hours"
        value={data.schedules}
        onChange={(value) => onChange('schedules', value)}
        helperText="Add operating hours, intake hours, and other schedules for each day."
      />
    </FormSection>
  );
});
