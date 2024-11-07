import { useApiConfig } from '@monorepo/expo/shared/clients';
import { AutocompleteInput } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { RefObject, useCallback, useRef, useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { useScrollToScreenTop } from '../../hooks';
import {
  TPlaceResult,
  TPlacesPrediction,
  getPlaceAutocomplete,
  getPlaceDetailsById,
} from '../../services';
import { AddressOption } from './AddressOption';

const DEFAULT_DEBOUNCE_MS = 100;

type TAddressAutocomplete<TForm extends FieldValues> = {
  name: Path<TForm>;
  control: Control<TForm>;
  label?: string;
  placeholder?: string;
  debounceMs?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  focusScroll?: {
    scrollViewRef: RefObject<ScrollView>;
    targetRef?: RefObject<View>;
  };
};

export function AddressAutocomplete<TForm extends FieldValues>(
  props: TAddressAutocomplete<TForm>
) {
  const {
    name,
    control,
    label,
    onFocus,
    onBlur,
    placeholder,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    focusScroll,
  } = props;

  const { scrollViewRef, targetRef } = focusScroll || {};

  const { scrollToTop } = useScrollToScreenTop(scrollViewRef);

  const addressViewRef = useRef<View>(null);

  const { baseUrl } = useApiConfig();

  const [predictions, setPredictions] = useState<TPlacesPrediction[]>([]);

  const getPredictions = async (input: string) => {
    if (!input.trim() || input.length < 3) {
      setPredictions([]);
      debouncedSearch.cancel();

      return;
    }

    debouncedSearch(input);
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      try {
        const result = await getPlaceAutocomplete({ baseUrl, query });

        setPredictions(result);
      } catch (e) {
        console.error(e);

        setPredictions([]);
      }
    }, debounceMs),
    []
  );

  function handleScrollToTop() {
    const targetScrollRef = targetRef || addressViewRef;

    if (!scrollToTop || !targetScrollRef) {
      return;
    }

    scrollToTop(targetScrollRef);
  }

  function handleFocus() {
    handleScrollToTop();

    onFocus && onFocus();
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const handleChange = (input: string) => {
          getPredictions(input);
          onChange(input);
        };

        return (
          <View ref={addressViewRef}>
            <AutocompleteInput<TPlacesPrediction>
              value={value || ''}
              placeholder={placeholder}
              label={label}
              predictions={predictions}
              onChangeText={handleChange}
              onFocus={handleFocus}
              onBlur={onBlur}
              onReset={() => onChange('')}
              errorMessage={error?.message}
              renderItem={(item) => (
                <AddressOption
                  key={item.place_id}
                  item={item}
                  onPress={async () => {
                    setPredictions([]);

                    const detailAddress = await getDetailAddress(item, baseUrl);

                    onChange(detailAddress);
                  }}
                />
              )}
            />
          </View>
        );
      }}
    />
  );
}

async function getDetailAddress(
  prediction: TPlacesPrediction,
  baseUrl: string
) {
  const placeId = prediction.place_id;

  if (!placeId || !baseUrl) {
    return '';
  }

  try {
    const deatailAddress = await getPlaceDetailsById({
      baseUrl,
      placeId,
    });

    return getPresentedAddress(deatailAddress);
  } catch (e) {
    console.error(e);

    return '';
  }
}

function getPresentedAddress(deatailAddress: TPlaceResult): string {
  const formattedAddress = deatailAddress.formatted_address || '';

  return formattedAddress.substring(0, formattedAddress.lastIndexOf(','));
}
