import { useState } from 'react';
import { useShelter } from '../../../../hooks/useShelter';
import { ShelterServicesForm } from './ShelterServicesForm';
import { toFormData } from './formSchema';

type TProps = {
  shelterId: string;
};

export function ShelterServices(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);

  const { shelter } = useShelter(shelterId);

  // function onSubmit(data: BasicInfoFormData) {
  //   // TODO: wire to update mutation
  //   console.log('SAVE', data);
  //   setEditMode(false);
  // }

  function onCancel() {
    setEditMode(false);
  }

  if (!shelter) {
    return null;
  }

  return (
    <ShelterServicesForm
      defaultValues={toFormData(shelter)}
      onSubmit={() => console.log('submit')}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
