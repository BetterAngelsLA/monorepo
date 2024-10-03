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
import { searchPlacesInCalifornia } from '../../../helpers';

const apiUrl = process.env['EXPO_PUBLIC_API_URL'];

export default function MailingAddress() {
  const [suggestions, setSuggestions] = useState<any>([]);

  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const mailingAddress = watch('mailingAddress') || '';

  const onReset = () => {
    setValue('mailingAddress', '');
  };

  const onSuggestionsSelect = async (place: any) => {
    const placeId = place.place_id;
    try {
      const response = await axios.get(
        `${apiUrl}/proxy/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: process.env['EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY'],
          },
        }
      );
      const formattedAddress = response.data.result.formatted_address;
      const cleanedAddress = formattedAddress.substring(
        0,
        formattedAddress.lastIndexOf(',')
      );
      setValue('mailingAddress', cleanedAddress);
      setSuggestions([]);
    } catch (e) {
      console.log('Error fetching detailed place');
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      await searchPlacesInCalifornia(query, setSuggestions);
    }, 300),
    []
  );

  const onChangeText = (e: string) => {
    setValue('mailingAddress', e);
    if (e.trim() === '' || e.length < 3) {
      setSuggestions([]);
      debouncedSearch.cancel();
      return;
    }
    debouncedSearch(e);
  };

  return (
    <CardWrapper onReset={onReset} title="Personal Mailing Address">
      <BasicInput
        onDelete={() => {
          setValue('mailingAddress', null);
          setSuggestions([]);
        }}
        value={mailingAddress}
        onChangeText={onChangeText}
        placeholder="Enter mailing address"
        autoCorrect={false}
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
