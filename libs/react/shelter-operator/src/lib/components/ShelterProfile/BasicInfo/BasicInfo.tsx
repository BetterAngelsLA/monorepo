import { useState } from 'react';
import { useShelter } from '../../../hooks/useShelter';
import { BasicInfoForm, type BasicInfoFormData } from '../BasicInfoForm';

type TProps = {
  shelterId: string;
};

export function BasicInfo(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);

  const { shelter } = useShelter(shelterId);

  const defaultValues: Partial<BasicInfoFormData> = {
    name: shelter?.name ?? '',
    description: shelter?.description ?? '',
    location: shelter?.location ?? null,
    email: shelter?.email ?? '',
    phone: shelter?.phone ?? '',
    website: shelter?.website ?? '',
    isPrivate: shelter?.isPrivate ?? false,
  };

  function onSubmit(data: BasicInfoFormData) {
    // TODO: wire to update mutation
    console.log('SAVE', data);
    setEditMode(false);
  }

  function onCancel() {
    setEditMode(false);
  }

  return (
    <BasicInfoForm
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
