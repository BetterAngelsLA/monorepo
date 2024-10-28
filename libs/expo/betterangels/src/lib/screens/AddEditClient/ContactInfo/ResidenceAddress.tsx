import { CardWrapper } from '@monorepo/expo/shared/ui-components';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import AddressAutocomplete from '../../../ui-components/AddressField';

const FIELD_NAME = 'residenceAddress';

type TForm = UpdateClientProfileInput | CreateClientProfileInput;

export default function ResidenceAddress() {
  const { control, setValue } = useFormContext<TForm>();

  const onReset = () => {
    setValue(FIELD_NAME, '');
  };

  const [selectedLanguage, setSelectedLanguage] = useState('java');

  return (
    <CardWrapper onReset={onReset} title="Residence Address">
      <AddressAutocomplete<TForm>
        name={FIELD_NAME}
        control={control}
        placeholder="Enter residence address"
      />

      <Picker
        selectedValue={selectedLanguage}
        onValueChange={(itemValue: string, itemIndex: number) =>
          setSelectedLanguage(itemValue)
        }
      >
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
      </Picker>
    </CardWrapper>
  );
}
