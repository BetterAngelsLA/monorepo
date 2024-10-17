import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import { AdaAccommodationPicker } from '../../../ui-components';

const FORM_KEY = 'adaAccommodation';

export default function AdaAccommodation() {
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  function handleReset(): void {
    setValue(FORM_KEY, []);
  }

  const watchedValue = watch(FORM_KEY) || [];

  return (
    <AdaAccommodationPicker
      withCard
      cardTitle
      onPress={(value) => {
        setValue(FORM_KEY, toggleValueInList(watchedValue, value));
      }}
      selected={watchedValue}
      onReset={handleReset}
    />
  );
}

function toggleValueInList<T>(list: T[], value: T): T[] {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }

  return [...list, value];
}
