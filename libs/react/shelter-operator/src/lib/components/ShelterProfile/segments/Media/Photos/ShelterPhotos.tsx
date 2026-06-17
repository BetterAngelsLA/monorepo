import { Upload } from 'lucide-react';
import { useState } from 'react';
import { Modal, ModalBody, ModalHeader } from '../../../../base-ui/modal';
import { Form } from '../../../../form/Form';
import { Table, type TableColumn } from '../../../../Table';
import { ShelterProfilePhotoType } from '../../../types';
import { DeleteShelterImageBtn } from './components/DeleteShelterImageBtn';
import { ShelterImagesUpload } from './components/ShelterImagesUpload';
import { ThumbImg } from './components/ThumbImg';
import { ToggleHeroShelterImageBtn } from './components/ToggleHeroShelterImageBtn';

function getLastPathSegment(path: string): string {
  return (path.split('/').at(-1) ?? path).toLowerCase();
}

function buildColumns(
  shelterId: string,
  heroImageId?: string
): TableColumn<ShelterProfilePhotoType>[] {
  return [
    {
      key: 'preview',
      label: 'Preview',
      width: '140px',
      render: (photo) => {
        return (
          <ThumbImg
            src={photo.file.urlThumb}
            srcLg={photo.file.urlLg}
            alt={`${photo.type.toLowerCase()} shelter photo`}
            className="w-28 h-16"
          />
        );
      },
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
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      render: (photo) => (
        <div className="flex items-center gap-3">
          <ToggleHeroShelterImageBtn
            photoId={photo.id}
            shelterId={shelterId}
            heroImageId={heroImageId}
          />
          <DeleteShelterImageBtn photoId={photo.id} shelterId={shelterId} />
        </div>
      ),
    },
  ];
}

type TProps = {
  photos: ShelterProfilePhotoType[];
  shelterId: string;
  heroImageId?: string;
};

export function ShelterPhotos(props: TProps) {
  const { photos = [], shelterId, heroImageId } = props;

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const columns = buildColumns(shelterId, heroImageId);

  return (
    <div className="p-8 flex flex-col gap-6">
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
            onCancel={() => setUploadModalOpen(false)}
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

      {!uploadModalOpen && (
        <Form.Actions
          onPrimaryClick={() => setUploadModalOpen(true)}
          primaryLabel="Upload Image"
          primaryLeftIcon={<Upload size={20} />}
          className="z-99"
        />
      )}
    </div>
  );
}
