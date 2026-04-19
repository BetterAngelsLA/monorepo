import { AdvancedMarker, Map as GoogleMap } from '@vis.gl/react-google-maps';
import { PenLine } from 'lucide-react';
import { memo } from 'react';
import { Dropdown } from '../../../../../components/base-ui/dropdown';
import { Input } from '../../../../../components/base-ui/input/Input';
import { FormSection } from '../../../../../components/form/FormSection';
import { useActiveOrg } from '../../../../../providers/activeOrg';
import type { SectionProps } from '../types';

const DEFAULT_CENTER = { lat: 34.04499, lng: -118.251601 };
const DEFAULT_ZOOM = 10;
const SELECTED_ZOOM = 15;

export const BasicInformationSection = memo(function BasicInformationSection({
  data,
  onChange,
  errors,
  isTouched,
}: SectionProps) {
  const { activeOrg } = useActiveOrg();

  const location = data.location;
  const hasLocation = Boolean(location?.latitude && location?.longitude);
  const mapCenter = hasLocation
    ? { lat: location?.latitude as number, lng: location?.longitude as number }
    : DEFAULT_CENTER;

  const updateLocation = (nextLocation: {
    place?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    onChange('location', {
      place: nextLocation.place ?? location?.place ?? '',
      latitude: nextLocation.latitude ?? location?.latitude,
      longitude: nextLocation.longitude ?? location?.longitude,
    });
  };

  return (
    <FormSection
      title="Basic Information"
      className="rounded-none border-0 bg-transparent p-0"
      contentClassName="space-y-6 py-6"
      titleClassName=""
    >
      <Input
        id="shelter-name"
        label="Shelter Name"
        value={data.name}
        onChange={(event) => onChange('name', event.target.value)}
        placeholder="Enter your shelter name"
        required
        error={errors.name}
        isTouched={isTouched}
      />

      <Dropdown
        label="Organization"
        placeholder="Please select"
        options={
          activeOrg ? [{ value: activeOrg.id, label: activeOrg.name }] : []
        }
        value={
          activeOrg ? { value: activeOrg.id, label: activeOrg.name } : null
        }
        onChange={(value) => onChange('organization', value?.value ?? '')}
        required
      />

      <Input
        id="shelter-address"
        label="Address"
        value={data.location?.place ?? ''}
        onChange={(event) => updateLocation({ place: event.target.value })}
        placeholder="Enter your address"
        required
        error={errors.location}
        isTouched={isTouched}
      />

      <div className="overflow-hidden rounded-[18px] border border-gray-200">
        <div className="h-[210px] w-full overflow-hidden md:h-[250px]">
          <GoogleMap
            mapId="SHELTER_LOCATION_MAP"
            className="h-full w-full"
            center={mapCenter}
            zoom={hasLocation ? SELECTED_ZOOM : DEFAULT_ZOOM}
            disableDefaultUI
            gestureHandling="greedy"
          >
            {hasLocation ? (
              <AdvancedMarker position={mapCenter} zIndex={99} />
            ) : null}
          </GoogleMap>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="shelter-latitude"
          label="Latitude"
          type="number"
          inputMode="decimal"
          step="any"
          placeholder="0°"
          value={location?.latitude ?? ''}
          onChange={(event) => {
            const nextValue = event.target.value;
            updateLocation({
              latitude: nextValue === '' ? undefined : Number(nextValue),
            });
          }}
        />

        <Input
          id="shelter-longitude"
          label="Longitude"
          type="number"
          inputMode="decimal"
          step="any"
          placeholder="0°"
          value={location?.longitude ?? ''}
          onChange={(event) => {
            const nextValue = event.target.value;
            updateLocation({
              longitude: nextValue === '' ? undefined : Number(nextValue),
            });
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="shelter-email"
          label="Email"
          value={data.email}
          onChange={(event) => onChange('email', event.target.value)}
          type="email"
          required
          placeholder="email@gmail.com"
          error={errors.email}
          isTouched={isTouched}
        />
        <Input
          id="shelter-phone"
          label="Phone Number"
          required
          value={data.phone}
          onChange={(event) => onChange('phone', event.target.value)}
          type="tel"
          placeholder="123-456-7890"
          error={errors.phone}
          isTouched={isTouched}
        />
      </div>

      <Input
        id="shelter-website"
        label="Website"
        value={data.website}
        required
        onChange={(event) => onChange('website', event.target.value)}
        type="url"
        placeholder="Enter your website"
        error={errors.website}
        isTouched={isTouched}
      />

      <Input
        id="shelter-facebook"
        label="Facebook"
        value={data.facebook}
        onChange={(event) => onChange('facebook', event.target.value)}
        placeholder="Enter your username"
      />
      <Input
        id="shelter-instagram"
        label="Instagram"
        value={data.instagram}
        onChange={(event) => onChange('instagram', event.target.value)}
        placeholder="Enter your username"
      />

      <Input
        id="shelter-other-social"
        label="Other Social Media"
        value={data.otherSocialMedia}
        onChange={(event) => onChange('otherSocialMedia', event.target.value)}
        placeholder="Enter your username"
      />

      <Input
        id="operating-hours"
        label="Operating Hours"
        value="00:00 AM - 00:00 AM"
        readOnly
        inputClassName="cursor-default"
        rightAdornment={<PenLine className="h-4 w-4" aria-hidden="true" />}
      />
    </FormSection>
  );
});
