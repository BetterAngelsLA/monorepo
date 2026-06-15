import { zodResolver } from '@hookform/resolvers/zod';
import { MimeTypes } from '@monorepo/react/shared';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../../base-ui/buttons';
import { FileUploadInput } from '../../../../base-ui/fileUpload';
import { Modal, ModalBody, ModalHeader } from '../../../../base-ui/modal';
import { Table, type TableColumn } from '../../../../Table';
import { ShelterProfilePhotoType } from '../../../types';
import { SectionHeader } from '../shared/SectionHeader';
import { defaultFormValues, formSchema, PhotosFormData } from './formSchema';
import { ThumbImg } from './ThumbImg';

const columns: TableColumn<ShelterProfilePhotoType>[] = [
  {
    key: 'preview',
    label: 'Preview',
    width: '140px',
    render: (photo) => (
      <ThumbImg
        src={photo.file.url}
        alt={`${photo.type.toLowerCase()} shelter photo`}
        className="w-24 h-24"
      />
    ),
  },
  {
    key: 'name',
    label: 'File Name',
    render: (photo) =>
      photo.file.name.replace(/^shelters?\//, '').toLowerCase(),
  },
  {
    key: 'type',
    label: 'Type',
    width: '140px',
    cellClassName: 'capitalize',
    render: (photo) => photo.type.toLowerCase(),
  },
];

type TProps = {
  onSave: (data: PhotosFormData) => void;
  photos: ShelterProfilePhotoType[];
};

export function ShelterPhotosForm(props: TProps) {
  const { onSave, photos = [] } = props;

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { handleSubmit } = useForm<PhotosFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="p-8 flex flex-col gap-6 border-red-500 border--x"
    >
      <SectionHeader>
        <Button
          className="ml-auto"
          color="blue"
          leftIcon={<Upload size={20} />}
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Image
        </Button>
      </SectionHeader>

      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        size="lg"
      >
        <ModalHeader onClose={() => setUploadModalOpen(false)}>
          Upload Image
        </ModalHeader>
        <ModalBody>
          <FileUploadInput
            acceptedMimeTypes={[MimeTypes.PNG, MimeTypes.JPEG, MimeTypes.WEBP]}
            multiple
            onChange={(files) => console.log(files)}
          />
        </ModalBody>
      </Modal>

      <Table
        columns={columns}
        rows={photos}
        getRowKey={(photo) => photo.id}
        headerClassName="px-0"
        rowClassName="mx-0 px-0"
      />
      {/* <Form.Actions onPrimaryClick={handleSubmit(onSave)} /> */}
    </form>
  );
}
