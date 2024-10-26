import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors } from '@monorepo/expo/shared/static';
import { BasicInput } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { getPlaceDetailsById, searchPlacesLA } from '../../services';
import { AddressOption } from './AddressOption';

const SEARCH_DEBOUNCE_MS = 300;

type TAutocompletePrediction = google.maps.places.AutocompletePrediction;

type TAddressField = {
  value: string;
  placeholder: string;
  onChange: (address: string) => void;
  onReset?: () => void;
};

export function AddressField(props: TAddressField) {
  const { value, onChange, onReset, placeholder } = props;

  const { baseUrl } = useApiConfig();
  const [predictions, setPredictions] = useState<TAutocompletePrediction[]>([]);

  const onChangeText = async (input: string) => {
    onChange(input);

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
        const result = await searchPlacesLA({ baseUrl, query });

        setPredictions(result);
      } catch (e) {
        console.error(e);

        setPredictions([]);
      }
    }, SEARCH_DEBOUNCE_MS),
    []
  );

  const onPredictionSelect = async (prediction: TAutocompletePrediction) => {
    const placeId = prediction.place_id;

    if (!placeId) {
      return;
    }

    setPredictions([]);

    const deatailAddress = await getPlaceDetailsById({
      baseUrl,
      placeId,
    });

    onChange(deatailAddress);
  };

  function onInputReset(): void {
    setPredictions([]);

    if (onReset) {
      onReset();
    }
  }

  return (
    <>
      <BasicInput
        value={value}
        onChangeText={onChangeText}
        onDelete={onInputReset}
        placeholder={placeholder}
        autoCorrect={false}
      />

      {!!predictions.length && (
        <View
          style={{
            backgroundColor: Colors.WHITE,
            flex: 1,
          }}
        >
          {predictions.map((prediction) => (
            <AddressOption
              key={prediction.place_id}
              item={prediction}
              onPress={() => onPredictionSelect(prediction)}
            />
          ))}
        </View>
      )}
    </>
  );
}
