import { Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../base-ui/buttons';
import { Modal, ModalBody, ModalHeader } from '../../../../base-ui/modal';
import { Table, type TableColumn } from '../../../../Table';
import { ShelterProfilePhotoType } from '../../../types';
import { SectionHeader } from '../shared/SectionHeader';
import { ShelterImagesUpload } from './ShelterImagesUpload';
import { ThumbImg } from './ThumbImg';

function getLastPathSegment(path: string): string {
  return (path.split('/').at(-1) ?? path).toLowerCase();
}

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
    render: (photo) => getLastPathSegment(photo.file.name),
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
  photos: ShelterProfilePhotoType[];
  shelterId: string;
};

export function ShelterPhotos(props: TProps) {
  const { photos = [], shelterId } = props;

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <div className="p-8 flex flex-col gap-6">
      <SectionHeader>
        <Button
          className="ml-auto"
          color="blue"
          leftIcon={<Upload size={20} />}
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Image x
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
          <ShelterImagesUpload
            shelterId={shelterId}
            onSuccess={() => setUploadModalOpen(false)}
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
    </div>
  );
}
