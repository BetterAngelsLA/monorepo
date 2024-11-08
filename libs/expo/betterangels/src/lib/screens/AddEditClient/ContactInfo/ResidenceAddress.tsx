import { CardWrapper } from '@monorepo/expo/shared/ui-components';
import { RefObject, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import AddressAutocomplete from '../../../ui-components/AddressField';

const FIELD_NAME = 'residenceAddress';

type TForm = UpdateClientProfileInput | CreateClientProfileInput;

type TProps = {
  scrollRef: RefObject<ScrollView>;
};

export default function ResidenceAddress(props: TProps) {
  const { scrollRef } = props;

  const parentRef = useRef(null);
  const { control, setValue } = useFormContext<TForm>();

  const onReset = () => {
    setValue(FIELD_NAME, '');
  };

  return (
    <View ref={parentRef}>
      <CardWrapper onReset={onReset} title="Residence Address">
        <AddressAutocomplete<TForm>
          name={FIELD_NAME}
          control={control}
          placeholder="Enter residence address"
          focusScroll={{
            scrollViewRef: scrollRef,
            targetRef: parentRef,
          }}
        />
      </CardWrapper>
    </View>
  );
}
