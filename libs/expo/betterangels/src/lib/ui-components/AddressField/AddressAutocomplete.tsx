import { TPlacePrediction } from '@monorepo/expo/shared/services';
import {
  AutocompleteInput,
  useGooglePlaces,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from 'lodash';
import { RefObject, useMemo, useRef, useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { useScrollToScreenTop } from '../../hooks';
import { AddressOption } from './AddressOption';

const DEFAULT_DEBOUNCE_MS = 100;

type TAddressAutocomplete<TForm extends FieldValues> = {
  name: Path<TForm>;
  control: Control<TForm>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  debounceMs?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  focusScroll?: {
    scrollViewRef: RefObject<ScrollView | null>;
    targetRef?: RefObject<View | null>;
  };
};

export function AddressAutocomplete<TForm extends FieldValues>(
  props: TAddressAutocomplete<TForm>
) {
  const {
    name,
    control,
    label,
    disabled,
    onFocus,
    onBlur,
    placeholder,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    focusScroll,
  } = props;

  const { scrollViewRef, targetRef } = focusScroll || {};

  const { scrollToTop } = useScrollToScreenTop(scrollViewRef);

  const addressViewRef = useRef<View>(null);

  const places = useGooglePlaces();

  const [predictions, setPredictions] = useState<TPlacePrediction[]>([]);

  const getPredictions = async (input: string) => {
    if (!input.trim() || input.length < 3) {
      setPredictions([]);
      debouncedSearch.cancel();

      return;
    }

    debouncedSearch(input);
  };

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          const result = await places.autocomplete(query);

          setPredictions(result);
        } catch (e) {
          console.error(e);

          setPredictions([]);
        }
      }, debounceMs),
    [debounceMs, places]
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
            <AutocompleteInput<TPlacePrediction>
              value={value || ''}
              placeholder={placeholder}
              label={label}
              disabled={disabled}
              predictions={predictions}
              onChangeText={handleChange}
              onFocus={handleFocus}
              onBlur={onBlur}
              onReset={() => onChange('')}
              errorMessage={error?.message}
              renderItem={(item) => (
                <AddressOption
                  key={item.placeId}
                  item={item}
                  onPress={async () => {
                    debouncedSearch.cancel();
                    setPredictions([]);

                    try {
                      const details = await places.getDetails(item.placeId);
                      const full = details.formattedAddress || '';
                      // Strip trailing country (everything after last comma)
                      onChange(full.substring(0, full.lastIndexOf(',')));
                    } catch (e) {
                      console.error(e);
                      onChange('');
                    }
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
