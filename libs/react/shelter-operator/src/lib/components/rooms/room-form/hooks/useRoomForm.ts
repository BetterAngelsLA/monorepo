import { useCallback, useState } from 'react';
import { createEmptyRoomFormData } from '../constants/defaultRoomFormData';
import type { RoomFormData } from '../formTypes';

export function useRoomForm(initialData?: RoomFormData) {
  const [formData, setFormData] = useState<RoomFormData>(
    initialData ?? createEmptyRoomFormData()
  );

  const updateField = useCallback(
    <K extends keyof RoomFormData>(field: K, value: RoomFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData(createEmptyRoomFormData());
  }, []);

  return { formData, updateField, resetForm };
}
