import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  CardWrapper,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import axios from 'axios';
import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { TouchableOpacity, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

const apiUrl = process.env['EXPO_PUBLIC_API_URL'];

export default function ResidenceAddress() {
  const [suggestions, setSuggestions] = useState<any>([]);

  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const residenceAddress = watch('residenceAddress') || '';

  const onReset = () => {
    setValue('residenceAddress', '');
  };

  const onSuggestionsSelect = (place: any) => {
    setValue('residenceAddress', place.description.split(', ')[0]);
    setSuggestions([]);
  };

  const searchPlacesInCalifornia = async (query: string) => {
    const url = `${apiUrl}/proxy/maps/api/place/autocomplete/json`;
    if (query.length < 3) {
      return;
    }

    // geocode for approx center of LA COUNTY
    const center = { lat: 34.04499, lng: -118.251601 };
    const defaultBounds = {
      north: center.lat + 0.1,
      south: center.lat - 0.1,
      east: center.lng + 0.1,
      west: center.lng - 0.1,
    };

    try {
      const response = await axios.get(url, {
        params: {
          bounds: defaultBounds,
          input: query,
          components: 'country:us',
          strictBounds: true,
          withCredentials: true,
        },
      });

      return setSuggestions(response.data.predictions);
    } catch (err) {
      console.error('Error fetching place data:', err);
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      await searchPlacesInCalifornia(query);
    }, 300),
    []
  );

  const onChangeText = (e: string) => {
    setValue('residenceAddress', e);
    if (e.trim() === '' || e.length < 3) {
      setSuggestions([]);
      debouncedSearch.cancel();
      return;
    }
    debouncedSearch(e);
  };

  return (
    <CardWrapper onReset={onReset} title="Residence Address">
      <BasicInput
        onDelete={() => {
          setValue('residenceAddress', null);
          setSuggestions([]);
        }}
        value={residenceAddress}
        onChangeText={onChangeText}
        placeholder="Enter residence address"
      />
      {suggestions.length > 0 && (
        <View
          style={{
            backgroundColor: Colors.WHITE,
            flex: 1,
          }}
        >
          {suggestions.map((item: any) => (
            <TouchableOpacity
              key={item.place_id}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: Colors.NEUTRAL_LIGHT,
                paddingVertical: Spacings.sm,
              }}
              accessibilityRole="button"
              onPress={() => onSuggestionsSelect(item)}
            >
              <TextRegular>{item.description.split(', ')[0]}</TextRegular>
              <TextRegular color={Colors.NEUTRAL_DARK} size="xxs">
                {item.description.split(', ')[1]},{' '}
                {item.description.split(', ')[2]}
              </TextRegular>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </CardWrapper>
  );
}
