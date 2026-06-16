import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../../base-ui/buttons';
import { Modal, ModalBody, ModalHeader } from '../../../../base-ui/modal';
import { Table, type TableColumn } from '../../../../Table';
import { ShelterProfilePhotoType } from '../../../types';
import { SectionHeader } from '../shared/SectionHeader';
import { defaultFormValues, formSchema, PhotosFormData } from './formSchema';
import { ShelterImagesUpload } from './ShelterImagesUpload';
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
    <form onSubmit={handleSubmit(onSave)} className="p-8 flex flex-col gap-6">
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
        size="2xl"
        contentClassname="pl-0 px-6 pb-4"
      >
        <ModalHeader
          className="pl-5 mb-3"
          onClose={() => setUploadModalOpen(false)}
        >
          <div className="font-medium text-2xl">Upload Images</div>
        </ModalHeader>
        <ModalBody className="px-0">
          <ShelterImagesUpload onSubmit={(data) => console.log(data)} />
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
