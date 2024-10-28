import { Colors } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import BasicInput from '../BasicInput';

const DEFAULT_VISIBLE_RESULTS = 5;

type TAutocompleteInput<T> = {
  value?: string;
  predictions: T[];
  label?: string;
  onChangeText: (input: string) => void;
  onReset?: () => void;
  onBlur?: () => void;
  maxResults?: number;
  placeholder?: string;
  errorMessage?: string;
  renderItem: (item: T) => React.ReactElement | null;
};

export function AutocompleteInput<T>(props: TAutocompleteInput<T>) {
  const {
    value,
    errorMessage,
    predictions,
    onChangeText,
    onReset,
    onBlur,
    placeholder,
    label,
    renderItem,
    maxResults = DEFAULT_VISIBLE_RESULTS,
  } = props;

  const visiblePredictions = (predictions || []).slice(0, maxResults);

  return (
    <>
      <BasicInput
        label={label}
        value={value || ''}
        onChangeText={onChangeText}
        onDelete={onReset}
        placeholder={placeholder}
        onBlur={onBlur}
        autoCorrect={false}
        errorMessage={errorMessage}
        error={!!errorMessage && !!String(errorMessage?.trim())}
      />

      {!!visiblePredictions.length && (
        <View
          style={{
            backgroundColor: Colors.WHITE,
            flex: 1,
          }}
        >
          {visiblePredictions.map((prediction) => renderItem(prediction))}
        </View>
      )}
    </>
  );
}
