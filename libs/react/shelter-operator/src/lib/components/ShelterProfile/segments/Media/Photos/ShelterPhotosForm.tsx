import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form } from '../../../../form/Form';
import { Table, type TableColumn } from '../../../../Table';
import { ShelterProfilePhotoType } from '../../../types';
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
        alt={photo.file.name}
        className="w-24 h-24"
      />
    ),
  },
  {
    key: 'name',
    label: 'File Name',
    render: (photo) => photo.file.name.toLowerCase(),
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

  const { handleSubmit } = useForm<PhotosFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="p-8 flex flex-col gap-6">
      <Table
        columns={columns}
        rows={photos}
        getRowKey={(photo) => photo.id}
        headerClassName="px-0"
        rowClassName="mx-0 px-0"
      />
      <Form.Actions onPrimaryClick={handleSubmit(onSave)} />
    </form>
  );
}
