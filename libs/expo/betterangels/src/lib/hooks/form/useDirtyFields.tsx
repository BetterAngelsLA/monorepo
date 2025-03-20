import { useFormContext } from 'react-hook-form';

export default function useDirtyFields(names: string[]) {
  const { formState } = useFormContext();

  return names.some((name) => formState.dirtyFields[name]);
}
