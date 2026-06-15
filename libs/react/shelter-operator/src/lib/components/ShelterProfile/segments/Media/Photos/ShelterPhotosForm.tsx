import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form } from '../../../../form/Form';
import { defaultFormValues, formSchema, PhotosFormData } from './formSchema';

type TProps = {
  onSave: (data: PhotosFormData) => void;
};

export function ShelterPhotosForm(props: TProps) {
  const { onSave } = props;

  const { handleSubmit } = useForm<PhotosFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="p-8">
      {/* TODO: add photo fields */}
      <Form.Actions onPrimaryClick={handleSubmit(onSave)} />
    </form>
  );
}
