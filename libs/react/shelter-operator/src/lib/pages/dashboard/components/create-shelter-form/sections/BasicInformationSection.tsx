import { ScheduleTypeChoices } from '@monorepo/react/shelter';
import { memo } from 'react';
import { FieldWrapper } from '../../../../../components/form/FieldWrapper';
import { FormSection } from '../../../../../components/form/FormSection';
import { SelectField } from '../../../../../components/form/SelectField';
import { TextField } from '../../../../../components/form/TextField';
import { INPUT_CLASS } from '../../../../../components/form/styles';
import { useActiveOrg } from '../../../../../providers/activeOrg';
import type { SectionProps } from '../types';

const OPERATING_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const value = `${String(hour).padStart(2, '0')}:00`;
  return { value, label: value };
});

export const BasicInformationSection = memo(function BasicInformationSection({
  data,
  onChange,
  errors,
}: SectionProps) {
  const { activeOrg } = useActiveOrg();
  const operatingScheduleIndex = data.schedules.findIndex(
    (entry) =>
      entry.scheduleType === ScheduleTypeChoices.Operating && !entry.isException
  );
  const operatingSchedule =
    operatingScheduleIndex >= 0 ? data.schedules[operatingScheduleIndex] : null;

  const handleOperatingHoursChange = (
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const baseEntry = operatingSchedule ?? {
      scheduleType: ScheduleTypeChoices.Operating,
      days: [],
      startTime: '',
      endTime: '',
      startDate: '',
      endDate: '',
      condition: '',
      isException: false,
    };

    const nextEntry = { ...baseEntry, [field]: value };
    const nextSchedules = [...data.schedules];

    if (operatingScheduleIndex >= 0) {
      nextSchedules[operatingScheduleIndex] = nextEntry;
    } else {
      nextSchedules.unshift(nextEntry);
    }

    onChange('schedules', nextSchedules);
  };

  const operatingStartTime = operatingSchedule?.startTime?.slice(0, 5) ?? '';
  const operatingEndTime = operatingSchedule?.endTime?.slice(0, 5) ?? '';

  return (
    <FormSection
      title="Basic Information"
      className="rounded-none border-0 bg-transparent p-0"
      contentClassName="space-y-5"
      titleClassName="text-4xl leading-tight"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              : [{ value: '', label: 'Select your organization' }]
          }
          onChange={(value) => onChange('organization', value)}
          placeholder="Select your organization"
          required
          error={errors.organization}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <FieldWrapper
          label="Address"
          htmlFor="shelter-address"
          error={errors.location}
          required
        >
          <input
            id="shelter-address"
            name="address"
            type="text"
            value={data.location?.place ?? ''}
            placeholder="Enter your address"
            onChange={(event) =>
              onChange('location', {
                place: event.target.value,
                latitude: data.location?.latitude,
                longitude: data.location?.longitude,
              })
            }
            className={INPUT_CLASS}
            aria-invalid={errors.location ? 'true' : undefined}
            required
          />
        </FieldWrapper>

        <FieldWrapper label="Operating Hours" htmlFor="operating-start-time">
          <div className="flex items-center gap-2">
            <select
              id="operating-start-time"
              className={INPUT_CLASS}
              value={operatingStartTime}
              onChange={(event) =>
                handleOperatingHoursChange('startTime', event.target.value)
              }
            >
              <option value="">00:00</option>
              {OPERATING_HOUR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="shrink-0 text-sm text-gray-500">to</span>
            <select
              id="operating-end-time"
              className={INPUT_CLASS}
              value={operatingEndTime}
              onChange={(event) =>
                handleOperatingHoursChange('endTime', event.target.value)
              }
            >
              <option value="">00:00</option>
              {OPERATING_HOUR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </FieldWrapper>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          id="shelter-facebook"
          name="facebook"
          label="Facebook"
          value={data.facebook}
          onChange={(value) => onChange('facebook', value)}
          placeholder="Enter your username"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id="shelter-instagram"
          name="instagram"
          label="Instagram"
          value={data.instagram}
          onChange={(value) => onChange('instagram', value)}
          placeholder="Enter your username"
        />

        <TextField
          id="shelter-other-social"
          name="other-social-media"
          label="Other Social Media"
          value={data.otherSocialMedia}
          onChange={(value) => onChange('otherSocialMedia', value)}
          placeholder="Enter your username"
        />
      </div>
    </FormSection>
  );
});
