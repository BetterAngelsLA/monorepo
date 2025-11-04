import { FormSection } from '../components/FormSection';
import { TextField } from '../components/TextField';
import type { SectionProps } from '../types';

export function BasicInformationSection({ data, onChange }: SectionProps) {
  return (
    <FormSection title="Basic Information">
      <TextField
        id="shelter-name"
        name="name"
        label="Shelter Name"
        value={data.name}
        onChange={value => onChange('name', value)}
        required
      />
      <TextField
        id="shelter-organization"
        name="organization"
        label="Organization"
        value={data.organization}
        onChange={value => onChange('organization', value)}
        helperText="Select from existing organizations or type to add a new one."
      />
      <TextField
        id="shelter-location"
        name="location"
        label="Location"
        value={data.location}
        onChange={value => onChange('location', value)}
        helperText='Use the format: "search query, latitude, longitude".'
      />
      <TextField
        id="shelter-email"
        name="email"
        label="Email"
        type="email"
        value={data.email}
        onChange={value => onChange('email', value)}
      />
      <TextField
        id="shelter-phone"
        name="phone"
        label="Phone"
        type="tel"
        value={data.phone}
        onChange={value => onChange('phone', value)}
      />
      <TextField
        id="shelter-website"
        name="website"
        label="Website"
        type="url"
        value={data.website}
        onChange={value => onChange('website', value)}
      />
      <TextField
        id="shelter-instagram"
        name="instagram"
        label="Instagram"
        value={data.instagram}
        onChange={value => onChange('instagram', value)}
      />
      <TextField
        id="shelter-facebook"
        name="facebook"
        label="Facebook"
        value={data.facebook}
        onChange={value => onChange('facebook', value)}
      />
      <TextField
        id="shelter-social"
        name="other_social_media"
        label="Other Social Media"
        value={data.other_social_media}
        onChange={value => onChange('other_social_media', value)}
      />
      <TextField
        id="shelter-hours"
        name="operating_hours"
        label="Operating Hours"
        value={data.operating_hours}
        onChange={value => onChange('operating_hours', value)}
        helperText='Use the format: "HH:MM:SS-HH:MM:SS,HH:MM:SS-HH:MM:SS,..."'
      />
    </FormSection>
  );
}
