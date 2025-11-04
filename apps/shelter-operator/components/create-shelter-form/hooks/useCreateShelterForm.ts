import { useCallback, useState } from 'react';
import type { ShelterFormData } from '../../../types';
import { createEmptyShelterFormData } from '../constants/defaultShelterFormData';

export function useCreateShelterForm(initialData?: ShelterFormData) {
  const [formData, setFormData] = useState<ShelterFormData>(
    initialData ?? createEmptyShelterFormData()
  );

  const updateField = useCallback(
    <K extends keyof ShelterFormData>(field: K, value: ShelterFormData[K]) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData(createEmptyShelterFormData());
  }, []);

  const replaceForm = useCallback((next: ShelterFormData) => {
    setFormData(next);
  }, []);

  return {
    formData,
    updateField,
    resetForm,
    replaceForm,
  };
}
