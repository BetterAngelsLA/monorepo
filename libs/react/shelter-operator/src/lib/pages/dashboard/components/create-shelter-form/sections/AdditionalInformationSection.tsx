import { memo } from 'react';
import { FileUploadInput } from '../../../../../components/base-ui/fileUpload';
import { FormSection } from '../../../../../components/form/FormSection';
import type { SectionProps } from '../types';

export const AdditionalInformationSection = memo(
  function AdditionalInformationSection({ data, onChange }: SectionProps) {
    return (
      <FormSection
        title="Additional Information"
        className="rounded-none border-0 bg-transparent p-0"
        contentClassName="space-y-6 py-6"
        titleClassName=""
      >
        <FileUploadInput
          label="Cover Image"
          value={data.coverImage}
          onChange={(files) => onChange('coverImage', files)}
          accept=".png,.jpg,.jpeg,.pdf"
          supportedFilesText="Files supported: PNG, JPEG, PDF"
        />
        <FileUploadInput
          label="Exterior Photos"
          value={data.exteriorPhotos}
          onChange={(files) => onChange('exteriorPhotos', files)}
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          supportedFilesText="Files supported: PNG, JPEG, PDF"
        />
        <FileUploadInput
          label="Interior Photos"
          value={data.interiorPhotos}
          onChange={(files) => onChange('interiorPhotos', files)}
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          supportedFilesText="Files supported: PNG, JPEG, PDF"
        />
        <FileUploadInput
          label="Videos"
          value={data.videos}
          onChange={(files) => onChange('videos', files)}
          multiple
          accept=".mov, .mp4"
          supportedFilesText="Files supported: MOV, MP4"
        />
        <FileUploadInput
          label="Agreement Form"
          value={data.agreementForm}
          onChange={(files) => onChange('agreementForm', files)}
          accept=".pdf, .docx"
          supportedFilesText="Files supported: PDF, DOCX"
        />
      </FormSection>
    );
  }
);
