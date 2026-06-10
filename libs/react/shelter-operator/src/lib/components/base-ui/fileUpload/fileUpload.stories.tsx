import type { Meta } from '@storybook/react';
import { useState } from 'react';
import { FileUploadInput } from './FileUploadInput';

const meta: Meta<typeof FileUploadInput> = {
  component: FileUploadInput,
  title: 'Base UI/File Upload',
  parameters: {
    customLayout: {
      canvasClassName: 'w-[54rem] max-w-[min(54rem,calc(100vw-4rem))]',
    },
  },
};

export default meta;

const storyWrapperClass = 'w-full p-4';

export const Default = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className={storyWrapperClass}>
      <FileUploadInput
        label="Field Label"
        value={files}
        onChange={setFiles}
        accept=".png,.jpg,.jpeg,.pdf"
        supportedFilesText="Files supported: PNG, JPEG, PDF"
      />
    </div>
  );
};

export const MultipleFiles = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className={storyWrapperClass}>
      <FileUploadInput
        label="Supporting Documents"
        value={files}
        onChange={setFiles}
        multiple
        accept=".png,.jpg,.jpeg,.pdf"
        supportedFilesText="Files supported: PNG, JPEG, PDF"
      />
    </div>
  );
};

export const WithError = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className={storyWrapperClass}>
      <FileUploadInput
        label="Field Label"
        value={files}
        onChange={setFiles}
        accept=".png,.jpg,.jpeg,.pdf"
        error="Please upload a supported file"
        isTouched
      />
    </div>
  );
};
