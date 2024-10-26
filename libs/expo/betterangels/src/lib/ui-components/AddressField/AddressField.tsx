import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors } from '@monorepo/expo/shared/static';
import { BasicInput } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { getPlaceDetailsById, searchPlacesLA } from '../../services';
import { AddressOption } from './AddressOption';

type TAutocompletePrediction = google.maps.places.AutocompletePrediction;

type TAddressField = {
  placeholder?: string;
};

export function AddressField(props: TAddressField) {
  const { placeholder } = props;

  const { baseUrl } = useApiConfig();

  const [address, setAddress] = useState('');
  const [predictions, setPredictions] = useState<TAutocompletePrediction[]>([]);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      try {
        const result = await searchPlacesLA({ baseUrl, query });

        setPredictions(result);
      } catch (e) {
        console.error(e);

        setPredictions([]);
      }
    }, 30),
    []
  );

  const onChangeText = async (input: string) => {
    setAddress(input);

    if (!input.trim() || input.length < 3) {
      setPredictions([]);
      debouncedSearch.cancel();

      return;
    }

    debouncedSearch(input);
  };

  const onAddressSelect = async (prediction: TAutocompletePrediction) => {
    const placeId = prediction.place_id;

    if (!placeId) {
      return;
    }

    setPredictions([]);

    const placeDetails = await getPlaceDetailsById({
      baseUrl,
      placeId,
    });

    setAddress(placeDetails);
  };

  return (
    <>
      <BasicInput
        onDelete={() => {
          setAddress('');
          setPredictions([]);
        }}
        value={address}
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
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
              onPress={() => onAddressSelect(prediction)}
            />
          ))}
        </View>
      )}
    </>
  );
}
