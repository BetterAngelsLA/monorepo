import { FormSection } from '../components/FormSection';
import { MultiFileField } from '../components/MultiFileField';
import { SingleFileField } from '../components/SingleFileField';
import type { SectionProps } from '../types';

export function MediaSection({ data, onChange }: SectionProps) {
  return (
    <FormSection title="Media">
      <SingleFileField
        id="hero-image"
        name="hero_image"
        label="Hero Image"
        value={data.hero_image}
        onChange={file => onChange('hero_image', file)}
        helperText="Upload a primary image representing the shelter."
        accept="image/*"
      />
      <MultiFileField
        id="exterior-photos"
        name="exterior_photos"
        label="Exterior Photos"
        values={data.exterior_photos}
        onChange={files => onChange('exterior_photos', files)}
        helperText="Upload multiple photos of the shelter exterior."
        accept="image/*"
      />
      <MultiFileField
        id="interior-photos"
        name="interior_photos"
        label="Interior Photos"
        values={data.interior_photos}
        onChange={files => onChange('interior_photos', files)}
        helperText="Upload multiple photos of the shelter interior."
        accept="image/*"
      />
      <MultiFileField
        id="videos"
        name="videos"
        label="Videos"
        values={data.videos}
        onChange={files => onChange('videos', files)}
        helperText="Upload videos that highlight programs or facilities."
        accept="video/*"
      />
    </FormSection>
  );
}
