import { useCallback, useState } from 'react';
import { createEmptyBedFormData } from '../constants/defaultBedFormData';
import type { BedFormData } from '../formTypes';

export function useBedForm(initialData?: BedFormData) {
  const [formData, setFormData] = useState<BedFormData>(
    initialData ?? createEmptyBedFormData()
  );

  const updateField = useCallback(
    <K extends keyof BedFormData>(field: K, value: BedFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData(createEmptyBedFormData());
  }, []);

  return { formData, updateField, resetForm };
}
