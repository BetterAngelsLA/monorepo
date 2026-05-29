import { useState } from 'react';
import { useShelter } from '../../../../hooks/useShelter';
import { ShelterBasicInfoForm } from './ShelterBasicInfoForm';
import { toBasicInfoFormData } from './formSchema';

type TProps = {
  shelterId: string;
};

export function ShelterBasicInfo(props: TProps) {
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
    <ShelterBasicInfoForm
      defaultValues={toBasicInfoFormData(shelter)}
      onSubmit={() => console.log('submit')}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
